import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  MembershipService,
  AccessContext,
} from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { LocationDto } from './dto/inventory.dto';

// Resolved location: exactly one key is set. Spread into Prisma where/create
// and pass `context` straight into verifyAccess.
export interface ResolvedLocation {
  branchId?: string;
  warehouseId?: string;
  context: AccessContext;
}

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  // --- READS ---

  async globalStock(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
    );
    return this.prisma.stockLevel.findMany({
      where: { variant: { product: { organizationId: orgId } } },
      include: {
        variant: { include: { product: true } },
        branch: true,
        warehouse: true,
      },
    });
  }

  // Stock rows at or below their configured reorder point (low-stock alerts).
  async lowStock(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
    );
    const levels = await this.prisma.stockLevel.findMany({
      where: {
        variant: { product: { organizationId: orgId } },
        reorderPoint: { not: null },
      },
      include: {
        variant: { include: { product: true } },
        branch: true,
        warehouse: true,
      },
    });
    return levels
      .filter((l) => l.reorderPoint != null && l.quantity <= l.reorderPoint)
      .sort((a, b) => a.quantity - b.quantity);
  }

  async locationStock(orgId: string, userId: string, loc: LocationDto) {
    const resolved = await this.resolveLocation(orgId, loc);
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_BRANCH_STOCK,
      resolved.context,
    );
    return this.prisma.stockLevel.findMany({
      where: {
        branchId: resolved.branchId ?? null,
        warehouseId: resolved.warehouseId ?? null,
        variant: { product: { organizationId: orgId } },
      },
      include: { variant: { include: { product: true } } },
    });
  }

  async movements(orgId: string, userId: string, variantId?: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
    );
    return this.prisma.stockMovement.findMany({
      where: { organizationId: orgId, ...(variantId ? { variantId } : {}) },
      include: {
        variant: { include: { product: true } },
        fromBranch: true,
        fromWarehouse: true,
        toBranch: true,
        toWarehouse: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Dated expiry batches for perishable stock (pool + every location). Drives the
  // inventory Expiry view and the write-off picker.
  async batches(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
    );
    return this.prisma.stockBatch.findMany({
      where: { organizationId: orgId, quantity: { gt: 0 } },
      include: {
        variant: { include: { product: true } },
        branch: true,
        warehouse: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // --- WRITES ---

  // Stock now enters via purchases (the receiving pool) and moves via
  // AllocationsService (allocate pool→location, transfer location→location) as
  // maker-checker STOCK_MOVE change requests. Direct purchase-in and adjustment
  // were removed; this service keeps reads plus the shared stock primitives.

  // --- SHARED STOCK PRIMITIVES (reused by SalesService inside its own tx) ---

  /**
   * Atomic, race-safe decrement. Throws if the location has insufficient stock.
   * Uses a guarded updateMany (quantity >= qty) rather than read-then-write.
   */
  async decrementStock(
    tx: Prisma.TransactionClient,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    qty: number,
  ) {
    const level = await tx.stockLevel.findFirst({
      where: {
        variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
      },
    });
    if (!level) {
      throw new BadRequestException('Insufficient stock at the location');
    }
    const res = await tx.stockLevel.updateMany({
      where: { id: level.id, quantity: { gte: qty } },
      data: { quantity: { decrement: qty } },
    });
    if (res.count === 0) {
      throw new BadRequestException('Insufficient stock at the location');
    }
  }

  /** Upsert-increment a StockLevel. Creates the row if it does not exist yet. */
  async incrementStock(
    tx: Prisma.TransactionClient,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    qty: number,
  ) {
    const res = await tx.stockLevel.updateMany({
      where: {
        variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
      },
      data: { quantity: { increment: qty } },
    });
    if (res.count > 0) return;

    try {
      await tx.stockLevel.create({
        data: {
          variantId,
          branchId: loc.branchId,
          warehouseId: loc.warehouseId,
          quantity: qty,
        },
      });
    } catch (e) {
      // Lost a race to create the row — increment the now-existing row.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        await tx.stockLevel.updateMany({
          where: {
            variantId,
            branchId: loc.branchId ?? null,
            warehouseId: loc.warehouseId ?? null,
          },
          data: { quantity: { increment: qty } },
        });
        return;
      }
      throw e;
    }
  }

  // --- EXPIRY BATCH PRIMITIVES (perishable variants only) -------------------
  // StockBatch mirrors StockLevel split by expiryDate. These run alongside the
  // StockLevel ops above so the per-location batch sum stays equal to the
  // StockLevel total for a perishable variant. Non-perishable variants never
  // touch StockBatch (the existing fast path is unchanged).

  /** Does this variant's product track expiry? */
  async isVariantPerishable(
    tx: Prisma.TransactionClient,
    variantId: string,
  ): Promise<boolean> {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { product: { select: { isPerishable: true } } },
    });
    return variant?.product?.isPerishable ?? false;
  }

  /** Add `qty` into the batch keyed by (variant, location, expiryDate). */
  async incrementBatch(
    tx: Prisma.TransactionClient,
    orgId: string,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    expiryDate: Date,
    qty: number,
  ) {
    const existing = await tx.stockBatch.findFirst({
      where: {
        variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
        expiryDate,
      },
    });
    if (existing) {
      await tx.stockBatch.update({
        where: { id: existing.id },
        data: { quantity: { increment: qty } },
      });
      return;
    }
    await tx.stockBatch.create({
      data: {
        organizationId: orgId,
        variantId,
        branchId: loc.branchId,
        warehouseId: loc.warehouseId,
        quantity: qty,
        expiryDate,
      },
    });
  }

  /**
   * Deplete `qty` from a location's batches, soonest expiry first (FEFO).
   * `mode` narrows which batches are eligible:
   *   - 'nonExpired': only batches expiring after `asOf` (selling).
   *   - 'expired': only batches at/▸before `asOf` (write-off).
   *   - 'any': every batch regardless of expiry (location→location moves).
   * Returns the consumed lots so callers can re-create them elsewhere.
   * Throws if eligible batch quantity is less than `qty`.
   */
  async decrementBatchesFEFO(
    tx: Prisma.TransactionClient,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    qty: number,
    mode: 'nonExpired' | 'expired' | 'any',
    asOf: Date,
  ): Promise<{ expiryDate: Date; quantity: number }[]> {
    const where: Prisma.StockBatchWhereInput = {
      variantId,
      branchId: loc.branchId ?? null,
      warehouseId: loc.warehouseId ?? null,
      quantity: { gt: 0 },
    };
    if (mode === 'nonExpired') where.expiryDate = { gt: asOf };
    else if (mode === 'expired') where.expiryDate = { lte: asOf };

    const batches = await tx.stockBatch.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });

    let remaining = qty;
    const consumed: { expiryDate: Date; quantity: number }[] = [];
    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(b.quantity, remaining);
      await tx.stockBatch.update({
        where: { id: b.id },
        data: { quantity: { decrement: take } },
      });
      consumed.push({ expiryDate: b.expiryDate, quantity: take });
      remaining -= take;
    }
    if (remaining > 0) {
      throw new BadRequestException(
        'Insufficient in-date stock for this perishable item',
      );
    }
    return consumed;
  }

  /** Sum of a location's batch quantity expiring after `asOf` (sellable). */
  async availableNonExpired(
    tx: Prisma.TransactionClient,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    asOf: Date,
  ): Promise<number> {
    const agg = await tx.stockBatch.aggregate({
      where: {
        variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
        expiryDate: { gt: asOf },
      },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }

  /** Sum of a location's batch quantity at/before `asOf` (expired). */
  async expiredQuantity(
    tx: Prisma.TransactionClient,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    asOf: Date,
  ): Promise<number> {
    const agg = await tx.stockBatch.aggregate({
      where: {
        variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
        expiryDate: { lte: asOf },
      },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }

  /**
   * Restock returned perishable units. We don't know the original batch, so add
   * to the branch's soonest-expiry open batch (best-effort), else create one
   * dated `fallbackDays` out. Documented v1 simplification for sale returns.
   */
  async restockPerishableReturn(
    tx: Prisma.TransactionClient,
    orgId: string,
    variantId: string,
    loc: { branchId?: string; warehouseId?: string },
    qty: number,
    fallbackDays = 30,
  ) {
    const earliest = await tx.stockBatch.findFirst({
      where: {
        variantId,
        branchId: loc.branchId ?? null,
        warehouseId: loc.warehouseId ?? null,
      },
      orderBy: { expiryDate: 'asc' },
    });
    if (earliest) {
      await tx.stockBatch.update({
        where: { id: earliest.id },
        data: { quantity: { increment: qty } },
      });
      return;
    }
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + fallbackDays);
    await this.incrementBatch(tx, orgId, variantId, loc, fallback, qty);
  }

  /**
   * Validate the polymorphic exactly-one-of-branch/warehouse rule and confirm
   * the location belongs to the org. Mirrors validateInviteLocations.
   */
  async resolveLocation(
    orgId: string,
    loc: { branchId?: string; warehouseId?: string },
  ): Promise<ResolvedLocation> {
    const hasBranch = !!loc.branchId;
    const hasWarehouse = !!loc.warehouseId;
    if (hasBranch === hasWarehouse) {
      throw new BadRequestException(
        'Each location must specify exactly one of branchId or warehouseId',
      );
    }

    if (hasBranch) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: loc.branchId, organizationId: orgId },
      });
      if (!branch)
        throw new NotFoundException('Branch not found in this organization');
      return { branchId: loc.branchId, context: { branchId: loc.branchId } };
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: loc.warehouseId, organizationId: orgId },
    });
    if (!warehouse)
      throw new NotFoundException('Warehouse not found in this organization');
    return {
      warehouseId: loc.warehouseId,
      context: { warehouseId: loc.warehouseId },
    };
  }

  private async assertVariantInOrg(
    tx: Prisma.TransactionClient,
    orgId: string,
    variantId: string,
  ) {
    const variant = await tx.productVariant.findFirst({
      where: { id: variantId, product: { organizationId: orgId } },
    });
    if (!variant)
      throw new NotFoundException(
        'Product variant not found in this organization',
      );
    return variant;
  }
}
