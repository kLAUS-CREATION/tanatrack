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
import {
  CreateAllocationDto,
  CreateTransferDto,
  WriteOffExpiredDto,
} from './dto/allocation.dto';

/**
 * Normalised STOCK_MOVE payload. A move always has a destination; the source is
 * the org receiving pool when `from*` is absent (allocation) or a real location
 * when present (transfer). Names are snapshotted so approval rows read well.
 */
interface StockMovePayload {
  variantId: string;
  quantity: number;
  fromBranchId?: string;
  fromWarehouseId?: string;
  toBranchId?: string;
  toWarehouseId?: string;
  reason?: string;
  reference?: string;
  variantName?: string;
  fromName?: string;
  toName?: string;
  // Expired-stock write-off: removes the source's expired batches with no
  // destination. The actual quantity is recomputed at apply time (more units
  // may have expired since the request was queued).
  writeOff?: boolean;
}

/**
 * Stock moves run through the shared maker-checker engine as STOCK_MOVE change
 * requests: INVENTORY_MANAGE holders queue a PENDING request (no stock moves
 * until approved); approvers (Owner / ADMINISTRATION_ACCESS) apply instantly.
 *
 * Two flavours, one transactional core:
 * - allocate: org-wide receiving pool (StockLevel with no location) → a location.
 * - transfer: one branch/warehouse → another.
 */
@Injectable()
export class AllocationsService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => ChangeRequestService))
    private changeRequests: ChangeRequestService,
  ) {}

  /** Allocate: move stock from the receiving pool to a branch/warehouse. */
  async create(orgId: string, userId: string, dto: CreateAllocationDto) {
    await this.assertCanManage(orgId, userId);
    // Validate up front so makers get immediate feedback; the real mutation
    // (re-validated) only runs when the change is applied/approved.
    const variant = await this.assertVariantInOrg(orgId, dto.variantId);
    const dest = await this.inventoryService.resolveLocation(orgId, {
      branchId: dto.branchId,
      warehouseId: dto.warehouseId,
    });

    // Snapshot human-readable labels into the payload so approval rows read well.
    const payload: StockMovePayload = {
      variantId: dto.variantId,
      quantity: dto.quantity,
      toBranchId: dest.branchId,
      toWarehouseId: dest.warehouseId,
      reason: dto.reason,
      reference: dto.reference,
      variantName: variant.name,
      fromName: 'Receiving pool',
      toName: await this.locationName(dest),
    };

    return this.submitMove(orgId, userId, payload);
  }

  /** Transfer: move stock from one branch/warehouse to another. */
  async transfer(orgId: string, userId: string, dto: CreateTransferDto) {
    await this.assertCanManage(orgId, userId);
    const variant = await this.assertVariantInOrg(orgId, dto.variantId);
    const src = await this.inventoryService.resolveLocation(orgId, {
      branchId: dto.fromBranchId,
      warehouseId: dto.fromWarehouseId,
    });
    const dest = await this.inventoryService.resolveLocation(orgId, {
      branchId: dto.toBranchId,
      warehouseId: dto.toWarehouseId,
    });
    if (
      src.branchId === dest.branchId &&
      src.warehouseId === dest.warehouseId
    ) {
      throw new BadRequestException(
        'Source and destination must be different locations',
      );
    }

    const payload: StockMovePayload = {
      variantId: dto.variantId,
      quantity: dto.quantity,
      fromBranchId: src.branchId,
      fromWarehouseId: src.warehouseId,
      toBranchId: dest.branchId,
      toWarehouseId: dest.warehouseId,
      reason: dto.reason,
      reference: dto.reference,
      variantName: variant.name,
      fromName: await this.locationName(src),
      toName: await this.locationName(dest),
    };

    return this.submitMove(orgId, userId, payload);
  }

  /**
   * Write off the expired units of a perishable variant at one location (or the
   * receiving pool when none is given). Queued/applied through the same
   * maker-checker engine; the exact quantity removed is recomputed when applied.
   */
  async writeOffExpired(
    orgId: string,
    userId: string,
    dto: WriteOffExpiredDto,
  ) {
    await this.assertCanManage(orgId, userId);
    const variant = await this.assertVariantInOrg(orgId, dto.variantId);

    // Pool when no location is given; otherwise validate the exactly-one rule.
    const hasLoc = !!(dto.branchId || dto.warehouseId);
    const loc: { branchId?: string; warehouseId?: string } = hasLoc
      ? await this.inventoryService.resolveLocation(orgId, {
          branchId: dto.branchId,
          warehouseId: dto.warehouseId,
        })
      : {};

    // Up-front feedback for the maker: nothing to do when no units are expired.
    const expired = await this.prisma.stockBatch.aggregate({
      where: {
        organizationId: orgId,
        variantId: dto.variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
        expiryDate: { lte: new Date() },
        quantity: { gt: 0 },
      },
      _sum: { quantity: true },
    });
    const expiredQty = expired._sum.quantity ?? 0;
    if (expiredQty <= 0) {
      throw new BadRequestException(
        'No expired stock to write off at this location',
      );
    }

    const payload: StockMovePayload = {
      variantId: dto.variantId,
      quantity: expiredQty, // snapshot for display; recomputed at apply time
      fromBranchId: loc.branchId,
      fromWarehouseId: loc.warehouseId,
      reason: dto.reason,
      variantName: variant.name,
      fromName: await this.locationName(loc),
      writeOff: true,
    };

    return this.submitMove(orgId, userId, payload);
  }

  /** Queue (maker) or apply (approver) a normalised stock move. */
  private submitMove(orgId: string, userId: string, payload: StockMovePayload) {
    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.STOCK_MOVE,
      operation: ChangeOp.CREATE,
      variantId: payload.variantId,
      payload,
      apply: () => this.applyStockMove(orgId, userId, payload),
    });
  }

  /**
   * Apply an approved stock-move change request. Invoked by ChangeRequestService;
   * `appliedBy` is recorded as the actor on the ledger movement.
   */
  async applyChange(
    orgId: string,
    request: { payload: Prisma.JsonValue },
    appliedBy: string,
  ): Promise<string> {
    const payload = this.normalizePayload(request.payload);
    const movement = await this.applyStockMove(orgId, appliedBy, payload);
    return movement.id;
  }

  /**
   * Coerce a persisted payload back into a StockMovePayload. Back-compat: legacy
   * allocation rows stored the destination as branchId/warehouseId rather than
   * to*; fall back to those so already-queued requests still apply.
   */
  private normalizePayload(raw: Prisma.JsonValue): StockMovePayload {
    const p = (raw ?? {}) as Record<string, any>;
    return {
      variantId: p.variantId,
      quantity: p.quantity,
      fromBranchId: p.fromBranchId,
      fromWarehouseId: p.fromWarehouseId,
      toBranchId: p.toBranchId ?? p.branchId,
      toWarehouseId: p.toWarehouseId ?? p.warehouseId,
      reason: p.reason,
      reference: p.reference,
      variantName: p.variantName,
      fromName: p.fromName,
      toName: p.toName,
      writeOff: !!p.writeOff,
    };
  }

  /**
   * The transactional core: take from the source (receiving pool when no from*
   * is set), place at the destination, and log the ledger movement.
   */
  private async applyStockMove(
    orgId: string,
    performedBy: string,
    p: StockMovePayload,
  ) {
    await this.assertVariantInOrg(orgId, p.variantId);
    if (p.writeOff) return this.applyWriteOff(orgId, performedBy, p);

    const dest = await this.inventoryService.resolveLocation(orgId, {
      branchId: p.toBranchId,
      warehouseId: p.toWarehouseId,
    });
    const hasSource = !!(p.fromBranchId || p.fromWarehouseId);
    const src = hasSource
      ? await this.inventoryService.resolveLocation(orgId, {
          branchId: p.fromBranchId,
          warehouseId: p.fromWarehouseId,
        })
      : null;

    return this.prisma.$transaction(async (tx) => {
      // Empty source location ({}) = the org receiving pool. The guarded
      // decrement surfaces a clear error when there isn't enough stock there.
      await this.inventoryService.decrementStock(
        tx,
        p.variantId,
        src ?? {},
        p.quantity,
      );
      await this.inventoryService.incrementStock(
        tx,
        p.variantId,
        dest,
        p.quantity,
      );

      // Perishable stock travels as dated batches: pull soonest-expiry lots from
      // the source (any expiry — expired units can still be relocated) and
      // re-create them at the destination so batch sums track StockLevel totals.
      if (await this.inventoryService.isVariantPerishable(tx, p.variantId)) {
        const lots = await this.inventoryService.decrementBatchesFEFO(
          tx,
          p.variantId,
          src ?? {},
          p.quantity,
          'any',
          new Date(),
        );
        for (const lot of lots) {
          await this.inventoryService.incrementBatch(
            tx,
            orgId,
            p.variantId,
            dest,
            lot.expiryDate,
            lot.quantity,
          );
        }
      }

      return tx.stockMovement.create({
        data: {
          organizationId: orgId,
          variantId: p.variantId,
          type: MovementType.TRANSFER,
          quantity: p.quantity,
          reason: p.reason,
          reference: p.reference,
          performedBy,
          // from* omitted for pool allocations.
          fromBranchId: src?.branchId,
          fromWarehouseId: src?.warehouseId,
          toBranchId: dest.branchId,
          toWarehouseId: dest.warehouseId,
        },
      });
    });
  }

  /**
   * Apply an expired-stock write-off: remove every unit currently expired at the
   * source (recomputed now, not when queued), depleting the dated batches and
   * the StockLevel together, and log an EXPIRY_WRITE_OFF ledger row.
   */
  private async applyWriteOff(
    orgId: string,
    performedBy: string,
    p: StockMovePayload,
  ) {
    const hasSource = !!(p.fromBranchId || p.fromWarehouseId);
    const loc: { branchId?: string; warehouseId?: string } = hasSource
      ? await this.inventoryService.resolveLocation(orgId, {
          branchId: p.fromBranchId,
          warehouseId: p.fromWarehouseId,
        })
      : {};

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const expiredQty = await this.inventoryService.expiredQuantity(
        tx,
        p.variantId,
        loc,
        now,
      );
      if (expiredQty <= 0) {
        throw new BadRequestException(
          'No expired stock to write off at this location',
        );
      }
      await this.inventoryService.decrementBatchesFEFO(
        tx,
        p.variantId,
        loc,
        expiredQty,
        'expired',
        now,
      );
      await this.inventoryService.decrementStock(
        tx,
        p.variantId,
        loc,
        expiredQty,
      );
      return tx.stockMovement.create({
        data: {
          organizationId: orgId,
          variantId: p.variantId,
          type: MovementType.EXPIRY_WRITE_OFF,
          quantity: expiredQty,
          reason: p.reason ?? 'Expired stock write-off',
          performedBy,
          fromBranchId: loc.branchId,
          fromWarehouseId: loc.warehouseId,
        },
      });
    });
  }

  /** Stock moves require INVENTORY_MANAGE (queued) or approver (instant). */
  private async assertCanManage(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.INVENTORY_MANAGE,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException(
        'Missing required permission: INVENTORY_MANAGE',
      );
    }
  }

  private async assertVariantInOrg(orgId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { organizationId: orgId } },
    });
    if (!variant)
      throw new NotFoundException(
        'Product variant not found in this organization',
      );
    return variant;
  }

  /** Human label for a resolved location; the receiving pool when neither is set. */
  private async locationName(loc: {
    branchId?: string;
    warehouseId?: string;
  }): Promise<string | undefined> {
    if (loc.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: loc.branchId },
        select: { name: true },
      });
      return branch?.name;
    }
    if (loc.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: loc.warehouseId },
        select: { name: true },
      });
      return warehouse?.name;
    }
    return 'Receiving pool';
  }
}
