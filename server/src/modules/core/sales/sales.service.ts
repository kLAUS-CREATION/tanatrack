import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { InventoryService } from '../inventory/inventory.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateSaleDto } from './dto/sale.dto';
import { CreateReturnDto } from './dto/return.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private inventoryService: InventoryService,
  ) {}

  // List the sales the user is allowed to see. SALES_VIEW_ALL holders see every
  // sale; otherwise the list falls back to the branches where the member holds
  // SALES_VIEW_BRANCH (so a branch-scoped seller still sees their own history).
  async findAll(orgId: string, userId: string) {
    const include = { items: { include: { variant: true } }, branch: true };

    const canViewAll = await this.membershipService.hasPermission(
      userId,
      orgId,
      PERMISSIONS.SALES_VIEW_ALL,
    );
    if (canViewAll) {
      const sales = await this.prisma.sale.findMany({
        where: { organizationId: orgId },
        include,
        orderBy: { createdAt: 'desc' },
      });
      return this.attachSellers(sales);
    }

    const viewable = await this.viewableBranchIds(orgId, userId);
    if (viewable.length === 0) return [];

    const sales = await this.prisma.sale.findMany({
      where: { organizationId: orgId, branchId: { in: viewable } },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return this.attachSellers(sales);
  }

  // Sale.soldBy is a bare userId (no FK relation), so resolve the seller's
  // name/image in one batched query and attach it to each row for display.
  private async attachSellers<T extends { soldBy: string }>(sales: T[]) {
    if (sales.length === 0) return sales.map((s) => ({ ...s, seller: null }));

    const ids = [...new Set(sales.map((s) => s.soldBy))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, image: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return sales.map((s) => ({ ...s, seller: byId.get(s.soldBy) ?? null }));
  }

  // Branches where the member may sell (holds SALES_CREATE). Drives the New Sale
  // button + branch picker so sellers only ever see branches they're assigned to.
  async sellableBranches(orgId: string, userId: string) {
    return this.branchesWithPermission(orgId, userId, PERMISSIONS.SALES_CREATE);
  }

  private async viewableBranchIds(
    orgId: string,
    userId: string,
  ): Promise<string[]> {
    const branches = await this.branchesWithPermission(
      orgId,
      userId,
      PERMISSIONS.SALES_VIEW_BRANCH,
    );
    return branches.map((b) => b.id);
  }

  // Org branches for which verifyAccess(slug, {branchId}) passes for this user.
  // Reuses the membership permission engine so OWNER / global-role cascades and
  // branch-scoped roles are all honoured consistently.
  private async branchesWithPermission(
    orgId: string,
    userId: string,
    slug: string,
  ) {
    const branches = await this.prisma.branch.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    const allowed = await Promise.all(
      branches.map((b) =>
        this.membershipService.hasPermission(userId, orgId, slug, {
          branchId: b.id,
        }),
      ),
    );
    return branches.filter((_, i) => allowed[i]);
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
    if (!branch)
      throw new NotFoundException('Branch not found in this organization');

    // Optional customer link. When provided, snapshot the name/phone onto the sale
    // so history stays readable from just a customerId; walk-ins pass free-text only.
    let customer: { name: string; phone: string | null } | null = null;
    if (dto.customerId) {
      customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId: orgId },
        select: { name: true, phone: true },
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

        // Perishable variants sell soonest-expiry-first and refuse expired
        // units; this throws before we touch the StockLevel when there isn't
        // enough in-date stock at the branch.
        if (await this.inventoryService.isVariantPerishable(tx, variant.id)) {
          await this.inventoryService.decrementBatchesFEFO(
            tx,
            variant.id,
            { branchId: dto.branchId },
            item.quantity,
            'nonExpired',
            new Date(),
          );
        }

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

      // total = subtotal - discount + tax (all minor units, clamped to >= 0).
      const discount = Math.min(dto.discount ?? 0, subtotal);
      const tax = dto.tax ?? 0;
      const total = Math.max(0, subtotal - discount + tax);

      // Mock gateway: amountPaid drives the settlement state. No real processing.
      const amountPaid = Math.min(dto.amountPaid ?? 0, total);
      const paymentStatus: PaymentStatus =
        amountPaid >= total && total > 0
          ? PaymentStatus.PAID
          : amountPaid > 0
            ? PaymentStatus.PARTIAL
            : PaymentStatus.UNPAID;

      const sale = await tx.sale.create({
        data: {
          organizationId: orgId,
          branchId: dto.branchId,
          soldBy: userId,
          customerId: dto.customerId,
          customerName: dto.customerName ?? customer?.name,
          customerPhone: dto.customerPhone ?? customer?.phone,
          subtotal,
          discount,
          tax,
          total,
          amountPaid,
          paymentMethod: dto.paymentMethod,
          paymentStatus,
          paymentRef: dto.paymentRef,
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

      // Credit sales: any unpaid remainder is added to the linked customer's
      // outstanding balance (receivable). Walk-ins can't carry a balance.
      const owed = total - amountPaid;
      if (dto.customerId && owed > 0) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { balance: { increment: owed } },
        });
      }

      return sale;
    });
  }

  // Partial, line-level return against a sale: restocks the returned units to the
  // branch, writes SALE_RETURN ledger rows, records a SaleReturn, and reduces the
  // linked customer's outstanding balance by the still-owed portion of the refund.
  async createReturn(
    orgId: string,
    userId: string,
    saleId: string,
    dto: CreateReturnDto,
  ) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId: orgId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');

    // Same gate as creating a sale: you can return where you can sell.
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SALES_CREATE,
      { branchId: sale.branchId },
    );

    const itemById = new Map(sale.items.map((i) => [i.id, i]));

    return this.prisma.$transaction(async (tx) => {
      let refundTotal = 0;
      const returnItemRows: {
        saleItemId: string;
        variantId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const r of dto.items) {
        const line = itemById.get(r.saleItemId);
        if (!line) {
          throw new BadRequestException(
            `Sale item ${r.saleItemId} does not belong to this sale`,
          );
        }
        const remaining = line.quantity - line.returnedQuantity;
        if (r.quantity > remaining) {
          throw new BadRequestException(
            `Cannot return ${r.quantity} of item ${r.saleItemId}; only ${remaining} remaining`,
          );
        }

        const lineTotal = line.unitPrice * r.quantity;
        refundTotal += lineTotal;

        // Restock to the branch the sale was made from.
        await this.inventoryService.incrementStock(
          tx,
          line.variantId,
          { branchId: sale.branchId },
          r.quantity,
        );

        // Perishable units also need a dated batch back; best-effort restock to
        // the branch's earliest open batch (v1 simplification — original lot
        // is not tracked through the sale).
        if (
          await this.inventoryService.isVariantPerishable(tx, line.variantId)
        ) {
          await this.inventoryService.restockPerishableReturn(
            tx,
            orgId,
            line.variantId,
            { branchId: sale.branchId },
            r.quantity,
          );
        }

        await tx.saleItem.update({
          where: { id: line.id },
          data: { returnedQuantity: { increment: r.quantity } },
        });

        returnItemRows.push({
          saleItemId: line.id,
          variantId: line.variantId,
          quantity: r.quantity,
          unitPrice: line.unitPrice,
          lineTotal,
        });
      }

      const saleReturn = await tx.saleReturn.create({
        data: {
          organizationId: orgId,
          saleId: sale.id,
          branchId: sale.branchId,
          processedBy: userId,
          total: refundTotal,
          reason: dto.reason,
          items: { create: returnItemRows },
        },
        include: { items: true },
      });

      // One SALE_RETURN ledger row per returned line (stock back into the branch).
      for (const row of returnItemRows) {
        await tx.stockMovement.create({
          data: {
            organizationId: orgId,
            variantId: row.variantId,
            type: MovementType.SALE_RETURN,
            quantity: row.quantity,
            reference: saleReturn.id,
            performedBy: userId,
            toBranchId: sale.branchId,
          },
        });
      }

      // Advance the sale's refund tally + settlement state.
      const newRefunded = sale.refundedTotal + refundTotal;
      const paymentStatus: PaymentStatus =
        newRefunded >= sale.total
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
      await tx.sale.update({
        where: { id: sale.id },
        data: { refundedTotal: newRefunded, paymentStatus },
      });

      // Cancel the still-owed portion of this sale first (a refund of already-paid
      // goods is a cash refund and doesn't change the receivable).
      if (sale.customerId) {
        const owedBefore = Math.max(
          0,
          sale.total - sale.amountPaid - sale.refundedTotal,
        );
        const reduction = Math.min(refundTotal, owedBefore);
        if (reduction > 0) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { balance: { decrement: reduction } },
          });
        }
      }

      return saleReturn;
    });
  }
}
