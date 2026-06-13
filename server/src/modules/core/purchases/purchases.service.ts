import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { InventoryService } from '../inventory/inventory.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreatePurchaseDto } from './dto/purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
    );
    return this.prisma.purchase.findMany({
      where: { organizationId: orgId },
      include: {
        items: { include: { variant: true } },
        branch: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, userId: string, purchaseId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_VIEW_GLOBAL_STOCK,
    );
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, organizationId: orgId },
      include: {
        items: { include: { variant: true } },
        branch: true,
        warehouse: true,
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async create(orgId: string, userId: string, dto: CreatePurchaseDto) {
    // Resolve + validate the destination location (exactly one of branch/warehouse).
    const dest = await this.inventoryService.resolveLocation(orgId, {
      branchId: dto.branchId,
      warehouseId: dto.warehouseId,
    });
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.INVENTORY_PURCHASE_IN,
      dest.context,
    );

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, organizationId: orgId },
      });
      if (!supplier)
        throw new NotFoundException('Supplier not found in this organization');
    }

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

        // Increase stock at the destination location.
        await this.inventoryService.incrementStock(
          tx,
          variant.id,
          dest,
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
          branchId: dest.branchId,
          warehouseId: dest.warehouseId,
          supplierId: dto.supplierId,
          supplierName: dto.supplierName,
          reference: dto.reference,
          receivedBy: userId,
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
            reason: dto.supplierName
              ? `Purchase from ${dto.supplierName}`
              : undefined,
            performedBy: userId,
            toBranchId: dest.branchId,
            toWarehouseId: dest.warehouseId,
          },
        });
      }

      return purchase;
    });
  }
}
