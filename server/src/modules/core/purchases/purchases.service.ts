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
      }[] = [];

      for (const item of dto.items) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, product: { organizationId: orgId } },
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

        itemRows.push({
          variantId: variant.id,
          quantity: item.quantity,
          unitCost,
          lineTotal,
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

  /** Recording purchases requires PURCHASE_MANAGE (queued) or approver (instant). */
  private async assertCanManage(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.PURCHASE_MANAGE,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException('Missing required permission: PURCHASE_MANAGE');
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
