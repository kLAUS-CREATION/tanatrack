import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  MembershipService,
  AccessContext,
} from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import {
  AdjustStockDto,
  LocationDto,
  PurchaseInDto,
  TransferStockDto,
} from './dto/inventory.dto';

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

  // --- WRITES ---

  async purchaseIn(orgId: string, userId: string, dto: PurchaseInDto) {
    const dest = await this.resolveLocation(orgId, dto);
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_PURCHASE_IN,
      dest.context,
    );

    return this.prisma.$transaction(async (tx) => {
      await this.assertVariantInOrg(tx, orgId, dto.variantId);
      await this.incrementStock(tx, dto.variantId, dest, dto.quantity);
      return tx.stockMovement.create({
        data: {
          organizationId: orgId,
          variantId: dto.variantId,
          type: MovementType.PURCHASE_IN,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference,
          performedBy: userId,
          toBranchId: dest.branchId,
          toWarehouseId: dest.warehouseId,
        },
      });
    });
  }

  async adjustStock(orgId: string, userId: string, dto: AdjustStockDto) {
    const loc = await this.resolveLocation(orgId, dto);
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_ADJUST_STOCK,
      loc.context,
    );

    return this.prisma.$transaction(async (tx) => {
      await this.assertVariantInOrg(tx, orgId, dto.variantId);

      const level = await tx.stockLevel.findFirst({
        where: {
          variantId: dto.variantId,
          branchId: loc.branchId ?? null,
          warehouseId: loc.warehouseId ?? null,
        },
      });
      const current = level?.quantity ?? 0;
      const target = dto.quantity;
      const delta = target - current;

      if (level) {
        await tx.stockLevel.update({
          where: { id: level.id },
          data: {
            quantity: target,
            reorderPoint: dto.reorderPoint ?? level.reorderPoint,
          },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            variantId: dto.variantId,
            branchId: loc.branchId,
            warehouseId: loc.warehouseId,
            quantity: target,
            reorderPoint: dto.reorderPoint,
          },
        });
      }

      if (delta === 0) return level;

      // quantity is the positive magnitude; direction is encoded by which side is set.
      const positive = delta > 0;
      return tx.stockMovement.create({
        data: {
          organizationId: orgId,
          variantId: dto.variantId,
          type: MovementType.ADJUSTMENT,
          quantity: Math.abs(delta),
          reason: dto.reason,
          performedBy: userId,
          toBranchId: positive ? loc.branchId : undefined,
          toWarehouseId: positive ? loc.warehouseId : undefined,
          fromBranchId: positive ? undefined : loc.branchId,
          fromWarehouseId: positive ? undefined : loc.warehouseId,
        },
      });
    });
  }

  async transferStock(orgId: string, userId: string, dto: TransferStockDto) {
    const src = await this.resolveLocation(orgId, dto.from);
    const dest = await this.resolveLocation(orgId, dto.to);

    if (src.branchId === dest.branchId && src.warehouseId === dest.warehouseId) {
      throw new BadRequestException(
        'Source and destination must be different locations',
      );
    }

    // Need permission to move stock out of the source AND into the destination.
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_TRANSFER_STOCK,
      src.context,
    );
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_TRANSFER_STOCK,
      dest.context,
    );

    return this.prisma.$transaction(async (tx) => {
      await this.assertVariantInOrg(tx, orgId, dto.variantId);
      await this.decrementStock(tx, dto.variantId, src, dto.quantity);
      await this.incrementStock(tx, dto.variantId, dest, dto.quantity);
      return tx.stockMovement.create({
        data: {
          organizationId: orgId,
          variantId: dto.variantId,
          type: MovementType.TRANSFER,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference,
          performedBy: userId,
          fromBranchId: src.branchId,
          fromWarehouseId: src.warehouseId,
          toBranchId: dest.branchId,
          toWarehouseId: dest.warehouseId,
        },
      });
    });
  }

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
