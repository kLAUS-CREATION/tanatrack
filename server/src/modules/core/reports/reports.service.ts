import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  /**
   * Composite overview for the Reports page: KPIs, sales trend, top products,
   * low-stock list, and inventory valuation by location.
   */
  async overview(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.REPORTS_VIEW_ALL_BRANCHES,
    );

    const [sales, purchases, stockLevels, productCount] = await Promise.all([
      this.prisma.sale.findMany({
        where: { organizationId: orgId },
        include: {
          items: { include: { variant: { include: { product: true } } } },
        },
      }),
      this.prisma.purchase.findMany({
        where: { organizationId: orgId },
        select: { total: true },
      }),
      this.prisma.stockLevel.findMany({
        where: { variant: { product: { organizationId: orgId } } },
        include: {
          variant: { include: { product: true } },
          branch: true,
          warehouse: true,
        },
      }),
      this.prisma.product.count({ where: { organizationId: orgId } }),
    ]);

    // --- KPIs ---
    const salesRevenue = sales.reduce((s, x) => s + x.total, 0);
    const purchaseSpend = purchases.reduce((s, x) => s + x.total, 0);

    // COGS = units sold × the variant's cost price (margin basis).
    let cogs = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        cogs += (item.variant?.costPrice ?? 0) * item.quantity;
      }
    }
    const grossProfit = salesRevenue - cogs;

    const inventoryValue = stockLevels.reduce(
      (s, l) => s + l.quantity * (l.variant?.costPrice ?? 0),
      0,
    );
    const lowStock = stockLevels.filter(
      (l) => l.reorderPoint != null && l.quantity <= l.reorderPoint,
    );

    // --- Sales trend: last 14 days, bucketed by day (UTC date key) ---
    const days = 14;
    const trendMap = new Map<string, number>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const sale of sales) {
      const key = new Date(sale.createdAt).toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, trendMap.get(key)! + sale.total);
    }
    const salesTrend = Array.from(trendMap.entries()).map(([date, total]) => ({
      date,
      total,
    }));

    // --- Top products by revenue ---
    const productAgg = new Map<
      string,
      { name: string; variantName: string; quantity: number; revenue: number }
    >();
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.variantId;
        const prev =
          productAgg.get(key) ??
          {
            name: item.variant?.product?.name ?? 'Unknown',
            variantName: item.variant?.name ?? '',
            quantity: 0,
            revenue: 0,
          };
        prev.quantity += item.quantity;
        prev.revenue += item.lineTotal;
        productAgg.set(key, prev);
      }
    }
    const topProducts = Array.from(productAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      kpis: {
        salesRevenue,
        purchaseSpend,
        cogs,
        grossProfit,
        inventoryValue,
        salesCount: sales.length,
        purchaseCount: purchases.length,
        productCount,
        lowStockCount: lowStock.length,
      },
      salesTrend,
      topProducts,
      lowStock: lowStock.map((l) => ({
        product: l.variant?.product?.name ?? 'Unknown',
        variant: l.variant?.name ?? '',
        sku: l.variant?.sku ?? '',
        location: l.branch?.name ?? l.warehouse?.name ?? '—',
        quantity: l.quantity,
        reorderPoint: l.reorderPoint ?? 0,
      })),
    };
  }
}
