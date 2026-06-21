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
   * Composite overview for the Reports page: KPIs, sales trend, revenue-vs-spend,
   * sales by branch, payment mix, inventory valuation by location, top products,
   * top customers, top categories, and the low-stock list.
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
          branch: { select: { name: true } },
          customer: { select: { name: true } },
          items: {
            include: {
              variant: {
                include: { product: { include: { category: true } } },
              },
            },
          },
        },
      }),
      this.prisma.purchase.findMany({
        where: { organizationId: orgId },
        select: { total: true, createdAt: true },
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
    const grossMargin = salesRevenue > 0 ? grossProfit / salesRevenue : 0;
    const averageOrderValue =
      sales.length > 0 ? Math.round(salesRevenue / sales.length) : 0;
    // Outstanding receivable = billed minus tendered, never negative.
    const receivables = sales.reduce(
      (s, x) => s + Math.max(0, x.total - x.amountPaid),
      0,
    );
    const returnsTotal = sales.reduce((s, x) => s + x.refundedTotal, 0);

    const inventoryValue = stockLevels.reduce(
      (s, l) => s + l.quantity * (l.variant?.costPrice ?? 0),
      0,
    );
    const inventoryUnits = stockLevels.reduce((s, l) => s + l.quantity, 0);
    const lowStock = stockLevels.filter(
      (l) => l.reorderPoint != null && l.quantity <= l.reorderPoint,
    );

    // --- Day buckets for the last 14 days (UTC date keys) ---
    const days = 14;
    const dayKeys: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }
    const revenueMap = new Map<string, number>(dayKeys.map((k) => [k, 0]));
    const spendMap = new Map<string, number>(dayKeys.map((k) => [k, 0]));
    for (const sale of sales) {
      const key = new Date(sale.createdAt).toISOString().slice(0, 10);
      if (revenueMap.has(key))
        revenueMap.set(key, revenueMap.get(key)! + sale.total);
    }
    for (const p of purchases) {
      const key = new Date(p.createdAt).toISOString().slice(0, 10);
      if (spendMap.has(key)) spendMap.set(key, spendMap.get(key)! + p.total);
    }
    const salesTrend = dayKeys.map((date) => ({
      date,
      total: revenueMap.get(date)!,
    }));
    const revenueVsSpend = dayKeys.map((date) => ({
      date,
      revenue: revenueMap.get(date)!,
      spend: spendMap.get(date)!,
    }));

    // --- Top products by revenue ---
    const productAgg = new Map<
      string,
      { name: string; variantName: string; quantity: number; revenue: number }
    >();
    // --- Top categories by revenue ---
    const categoryAgg = new Map<string, number>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.variantId;
        const prev = productAgg.get(key) ?? {
          name: item.variant?.product?.name ?? 'Unknown',
          variantName: item.variant?.name ?? '',
          quantity: 0,
          revenue: 0,
        };
        prev.quantity += item.quantity;
        prev.revenue += item.lineTotal;
        productAgg.set(key, prev);

        const catName =
          item.variant?.product?.category?.name ?? 'Uncategorized';
        categoryAgg.set(
          catName,
          (categoryAgg.get(catName) ?? 0) + item.lineTotal,
        );
      }
    }
    const topProducts = Array.from(productAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const topCategories = Array.from(categoryAgg.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // --- Sales by branch ---
    const branchAgg = new Map<string, { total: number; count: number }>();
    // --- Payment method mix ---
    const methodAgg = new Map<string, { total: number; count: number }>();
    // --- Top customers by revenue ---
    const customerAgg = new Map<
      string,
      { name: string; revenue: number; orders: number }
    >();
    for (const sale of sales) {
      const branchName = sale.branch?.name ?? '—';
      const b = branchAgg.get(branchName) ?? { total: 0, count: 0 };
      b.total += sale.total;
      b.count += 1;
      branchAgg.set(branchName, b);

      const method = sale.paymentMethod ?? 'UNKNOWN';
      const m = methodAgg.get(method) ?? { total: 0, count: 0 };
      m.total += sale.total;
      m.count += 1;
      methodAgg.set(method, m);

      const custName = sale.customerName ?? sale.customer?.name ?? 'Walk-in';
      const custKey = sale.customerId ?? `name:${custName}`;
      const c = customerAgg.get(custKey) ?? {
        name: custName,
        revenue: 0,
        orders: 0,
      };
      c.revenue += sale.total;
      c.orders += 1;
      customerAgg.set(custKey, c);
    }
    const salesByBranch = Array.from(branchAgg.entries())
      .map(([name, v]) => ({ name, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total);
    const paymentMethods = Array.from(methodAgg.entries())
      .map(([method, v]) => ({ method, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total);
    const topCustomers = Array.from(customerAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // --- Inventory valuation by location ---
    const locationAgg = new Map<string, { value: number; units: number }>();
    for (const l of stockLevels) {
      const name = l.branch?.name ?? l.warehouse?.name ?? '—';
      const agg = locationAgg.get(name) ?? { value: 0, units: 0 };
      agg.value += l.quantity * (l.variant?.costPrice ?? 0);
      agg.units += l.quantity;
      locationAgg.set(name, agg);
    }
    const inventoryByLocation = Array.from(locationAgg.entries())
      .map(([name, v]) => ({ name, value: v.value, units: v.units }))
      .sort((a, b) => b.value - a.value);

    return {
      kpis: {
        salesRevenue,
        purchaseSpend,
        cogs,
        grossProfit,
        grossMargin,
        averageOrderValue,
        receivables,
        returnsTotal,
        inventoryValue,
        inventoryUnits,
        salesCount: sales.length,
        purchaseCount: purchases.length,
        productCount,
        lowStockCount: lowStock.length,
      },
      salesTrend,
      revenueVsSpend,
      salesByBranch,
      paymentMethods,
      inventoryByLocation,
      topProducts,
      topCustomers,
      topCategories,
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
