import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeEntity, ChangeOp, MovementType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { InventoryService } from '../inventory/inventory.service';
import { ChangeRequestService } from '../change-requests/change-request.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreatePurchaseDto } from './dto/purchase.dto';
import { CreatePurchaseReturnDto } from './dto/purchase-return.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import { resolvePaging, type Paginated } from 'src/common/dto/pagination.dto';

// Shared include for purchase list rows.
const PURCHASE_LIST_INCLUDE = {
  items: { include: { variant: true } },
  branch: true,
  warehouse: true,
  supplier: { select: { id: true, name: true } },
} satisfies Prisma.PurchaseInclude;

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => ChangeRequestService))
    private changeRequests: ChangeRequestService,
  ) {}

  async findAll(orgId: string, userId: string) {
    await this.assertCanView(orgId, userId);
    return this.prisma.purchase.findMany({
      where: { organizationId: orgId },
      include: {
        items: { include: { variant: true } },
        branch: true,
        warehouse: true,
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Server-paginated + filtered list for the purchases page.
  async findAllPaged(
    orgId: string,
    userId: string,
    query: PurchaseQueryDto,
  ): Promise<
    Paginated<
      Prisma.PurchaseGetPayload<{ include: typeof PURCHASE_LIST_INCLUDE }>
    >
  > {
    await this.assertCanView(orgId, userId);
    const { skip, take, page, pageSize } = resolvePaging(query);

    const search = query.search?.trim();
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setDate(end.getDate() + 1); // inclusive of the whole `to` day
      createdAt.lt = end;
    }

    const where: Prisma.PurchaseWhereInput = {
      organizationId: orgId,
      ...(query.from || query.to ? { createdAt } : {}),
      // Match the displayed name: linked supplier's name, else the snapshot.
      ...(query.supplier
        ? {
            OR: [
              { supplier: { name: query.supplier } },
              { supplierId: null, supplierName: query.supplier },
            ],
          }
        : {}),
      ...(search
        ? {
            OR: [
              { supplierName: { contains: search, mode: 'insensitive' } },
              { reference: { contains: search, mode: 'insensitive' } },
              { supplier: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        include: PURCHASE_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.purchase.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(orgId: string, userId: string, purchaseId: string) {
    await this.assertCanView(orgId, userId);
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, organizationId: orgId },
      include: {
        items: { include: { variant: true } },
        branch: true,
        warehouse: true,
        supplier: { select: { id: true, name: true } },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  // ============================================================
  //  MAKER–CHECKER
  //  PURCHASE_MANAGE holders queue a purchase (no stock moves until approved);
  //  approvers (Owner / ADMINISTRATION_ACCESS) apply it instantly. On approval
  //  the approver/actor is recorded as the receiver of the stock.
  // ============================================================

  async create(orgId: string, userId: string, dto: CreatePurchaseDto) {
    await this.assertCanManage(orgId, userId);
    // Validate the request up front so makers get immediate feedback; the real
    // mutation (re-validated) only runs when the change is applied/approved.
    await this.assertSupplierInOrg(orgId, dto.supplierId);
    await this.assertExpiriesProvided(orgId, dto.items);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.PURCHASE,
      operation: ChangeOp.CREATE,
      payload: dto as unknown as object,
      // Instant path: the acting approver receives the stock.
      apply: () => this.applyPurchase(orgId, userId, dto),
    });
  }

  /**
   * Apply an approved purchase change request. Invoked by ChangeRequestService;
   * `appliedBy` is the approver, who is recorded as the receiver of the stock.
   */
  async applyChange(
    orgId: string,
    request: { payload: Prisma.JsonValue },
    appliedBy: string,
  ): Promise<string> {
    const dto = (request.payload ?? {}) as unknown as CreatePurchaseDto;
    const purchase = await this.applyPurchase(orgId, appliedBy, dto);
    return purchase.id;
  }

  /**
   * The transactional core: validate, increase stock, write the ledger.
   * Stock lands in the org-wide receiving pool (no destination location) — it is
   * allocated to a branch/warehouse later via the Allocations flow.
   */
  private async applyPurchase(
    orgId: string,
    receivedBy: string,
    dto: CreatePurchaseDto,
  ) {
    const supplier = await this.assertSupplierInOrg(orgId, dto.supplierId);
    // Snapshot the supplier name so the purchase reads well even if the supplier
    // is later renamed/removed; falls back to the free-text "unknown" name.
    const supplierName = supplier?.name ?? dto.supplierName;

    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const itemRows: {
        variantId: string;
        quantity: number;
        unitCost: number;
        lineTotal: number;
        expiryDate?: Date | null;
      }[] = [];

      for (const item of dto.items) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, product: { organizationId: orgId } },
          include: { product: { select: { isPerishable: true } } },
        });
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} not found in this organization`,
          );
        }

        const unitCost = item.unitCost ?? variant.costPrice;
        const lineTotal = unitCost * item.quantity;
        total += lineTotal;

        // Increase stock in the org-wide receiving pool (empty location = both null).
        await this.inventoryService.incrementStock(
          tx,
          variant.id,
          {},
          item.quantity,
        );

        // Perishable goods must carry an expiry date; record a dated pool batch.
        let expiryDate: Date | null = null;
        if (variant.product.isPerishable) {
          if (!item.expiryDate) {
            throw new BadRequestException(
              `An expiry date is required for perishable item ${variant.name}`,
            );
          }
          expiryDate = new Date(item.expiryDate);
          await this.inventoryService.incrementBatch(
            tx,
            orgId,
            variant.id,
            {},
            expiryDate,
            item.quantity,
          );
        }

        itemRows.push({
          variantId: variant.id,
          quantity: item.quantity,
          unitCost,
          lineTotal,
          expiryDate,
        });
      }

      const purchase = await tx.purchase.create({
        data: {
          organizationId: orgId,
          supplierId: dto.supplierId,
          supplierName,
          reference: dto.reference,
          receivedBy,
          total,
          items: { create: itemRows },
        },
        include: { items: { include: { variant: true } } },
      });

      // One PURCHASE_IN ledger row per line, referencing the purchase.
      for (const row of itemRows) {
        await tx.stockMovement.create({
          data: {
            organizationId: orgId,
            variantId: row.variantId,
            type: MovementType.PURCHASE_IN,
            quantity: row.quantity,
            reference: purchase.id,
            reason: supplierName ? `Purchase from ${supplierName}` : undefined,
            performedBy: receivedBy,
            // No to* location: stock is received into the org receiving pool.
          },
        });
      }

      return purchase;
    });
  }

  // ============================================================
  //  RETURNS (to supplier — mirror of sale returns)
  //  Stock leaves the org receiving pool back to the supplier. Applied directly
  //  (like sale returns) under the same PURCHASE_MANAGE/approver gate; capped by
  //  each line's un-returned quantity and by what is still in the pool (units
  //  already allocated to a location can't be returned to the supplier).
  // ============================================================

  async findReturns(orgId: string, userId: string, purchaseId: string) {
    await this.assertCanView(orgId, userId);
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, organizationId: orgId },
      select: { id: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return this.prisma.purchaseReturn.findMany({
      where: { organizationId: orgId, purchaseId },
      include: {
        items: { include: { purchaseItem: { include: { variant: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReturn(
    orgId: string,
    userId: string,
    purchaseId: string,
    dto: CreatePurchaseReturnDto,
  ) {
    await this.assertCanManage(orgId, userId);

    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, organizationId: orgId },
      include: { items: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    const itemById = new Map(purchase.items.map((i) => [i.id, i]));
    const asOf = new Date();

    return this.prisma.$transaction(async (tx) => {
      let returnTotal = 0;
      const returnItemRows: {
        purchaseItemId: string;
        variantId: string;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];

      for (const r of dto.items) {
        const line = itemById.get(r.purchaseItemId);
        if (!line) {
          throw new BadRequestException(
            `Purchase item ${r.purchaseItemId} does not belong to this purchase`,
          );
        }
        const remaining = line.quantity - line.returnedQuantity;
        if (r.quantity > remaining) {
          throw new BadRequestException(
            `Cannot return ${r.quantity} of item ${r.purchaseItemId}; only ${remaining} remaining`,
          );
        }

        const lineTotal = line.unitCost * r.quantity;
        returnTotal += lineTotal;

        // Pull the units back out of the receiving pool (empty location). Throws
        // if the pool no longer holds them (already allocated to a location).
        await this.inventoryService.decrementStock(
          tx,
          line.variantId,
          {},
          r.quantity,
        );

        // Keep perishable batches in step: drop the returned units from the
        // pool's open lots (soonest expiry first).
        if (
          await this.inventoryService.isVariantPerishable(tx, line.variantId)
        ) {
          await this.inventoryService.decrementBatchesFEFO(
            tx,
            line.variantId,
            {},
            r.quantity,
            'any',
            asOf,
          );
        }

        await tx.purchaseItem.update({
          where: { id: line.id },
          data: { returnedQuantity: { increment: r.quantity } },
        });

        returnItemRows.push({
          purchaseItemId: line.id,
          variantId: line.variantId,
          quantity: r.quantity,
          unitCost: line.unitCost,
          lineTotal,
        });
      }

      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          organizationId: orgId,
          purchaseId: purchase.id,
          supplierId: purchase.supplierId,
          supplierName: purchase.supplierName,
          processedBy: userId,
          total: returnTotal,
          reason: dto.reason,
          items: { create: returnItemRows },
        },
        include: { items: true },
      });

      // One PURCHASE_RETURN ledger row per returned line (stock leaving the pool).
      for (const row of returnItemRows) {
        await tx.stockMovement.create({
          data: {
            organizationId: orgId,
            variantId: row.variantId,
            type: MovementType.PURCHASE_RETURN,
            quantity: row.quantity,
            reference: purchaseReturn.id,
            reason: purchase.supplierName
              ? `Return to ${purchase.supplierName}`
              : undefined,
            performedBy: userId,
            // No from* location: stock leaves the org receiving pool.
          },
        });
      }

      return purchaseReturn;
    });
  }

  /** Recording purchases requires PURCHASE_MANAGE (queued) or approver (instant). */
  private async assertCanManage(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.PURCHASE_MANAGE,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException(
        'Missing required permission: PURCHASE_MANAGE',
      );
    }
  }

  /** Anyone who can record purchases, view global stock, or approve may read. */
  private async assertCanView(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
      )) ||
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.PURCHASE_MANAGE,
      )) ||
      (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException(
        'Missing required permission: INVENTORY_VIEW_GLOBAL_STOCK',
      );
    }
  }

  /** Up-front guard: every perishable line must carry an expiry date. */
  private async assertExpiriesProvided(
    orgId: string,
    items: { variantId: string; expiryDate?: string }[],
  ) {
    const perishable = await this.prisma.productVariant.findMany({
      where: {
        id: { in: items.map((i) => i.variantId) },
        product: { isPerishable: true, organizationId: orgId },
      },
      select: { id: true, name: true },
    });
    const byId = new Map(perishable.map((v) => [v.id, v.name]));
    for (const item of items) {
      if (byId.has(item.variantId) && !item.expiryDate) {
        throw new BadRequestException(
          `An expiry date is required for perishable item ${byId.get(item.variantId)}`,
        );
      }
    }
  }

  private async assertSupplierInOrg(orgId: string, supplierId?: string) {
    if (!supplierId) return null;
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
    });
    if (!supplier)
      throw new NotFoundException('Supplier not found in this organization');
    return supplier;
  }
}
