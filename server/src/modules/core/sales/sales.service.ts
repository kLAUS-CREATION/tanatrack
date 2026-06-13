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
import { CreateSaleDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SALES_VIEW_ALL,
    );
    return this.prisma.sale.findMany({
      where: { organizationId: orgId },
      include: { items: { include: { variant: true } }, branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBranch(orgId: string, userId: string, branchId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SALES_VIEW_BRANCH,
      { branchId },
    );
    return this.prisma.sale.findMany({
      where: { organizationId: orgId, branchId },
      include: { items: { include: { variant: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, userId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId: orgId },
      include: { items: { include: { variant: true } }, branch: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');

    // Branch-scoped read; the org-wide SALES_VIEW_ALL role cascades to every branch.
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SALES_VIEW_BRANCH,
      { branchId: sale.branchId },
    );
    return sale;
  }

  async create(orgId: string, userId: string, dto: CreateSaleDto) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SALES_CREATE,
      { branchId: dto.branchId },
    );

    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, organizationId: orgId },
    });
    if (!branch) throw new NotFoundException('Branch not found in this organization');

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId: orgId },
      });
      if (!customer)
        throw new NotFoundException('Customer not found in this organization');
    }

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const itemRows: {
        variantId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const item of dto.items) {
        const variant = await tx.productVariant.findFirst({
          where: {
            id: item.variantId,
            isActive: true,
            product: { organizationId: orgId },
          },
        });
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} not found or inactive`,
          );
        }

        const unitPrice = item.unitPrice ?? variant.sellingPrice;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        // Deduct from this branch's stock (race-safe guarded decrement).
        await this.inventoryService.decrementStock(
          tx,
          variant.id,
          { branchId: dto.branchId },
          item.quantity,
        );

        itemRows.push({
          variantId: variant.id,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      const total = subtotal; // no tax/discount yet

      const sale = await tx.sale.create({
        data: {
          organizationId: orgId,
          branchId: dto.branchId,
          soldBy: userId,
          customerId: dto.customerId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          subtotal,
          total,
          items: { create: itemRows },
        },
        include: { items: { include: { variant: true } } },
      });

      // One SALE_OUT ledger row per line, referencing the sale.
      for (const row of itemRows) {
        await tx.stockMovement.create({
          data: {
            organizationId: orgId,
            variantId: row.variantId,
            type: MovementType.SALE_OUT,
            quantity: row.quantity,
            reference: sale.id,
            performedBy: userId,
            fromBranchId: dto.branchId,
          },
        });
      }

      return sale;
    });
  }
}
