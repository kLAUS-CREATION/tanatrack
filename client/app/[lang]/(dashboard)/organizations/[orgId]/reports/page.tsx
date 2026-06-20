"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Wallet,
  Boxes,
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart3,
  Receipt,
  HandCoins,
  Undo2,
  Store,
  CreditCard,
  Warehouse,
  Crown,
  FolderTree,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { useGetReportOverviewQuery } from "@/lib/features/services/reports.api";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Compact axis label for minor-unit money (e.g. 1_250_00 → "1.3k"). */
function compactMoney(minor: number): string {
  const major = minor / 100;
  if (Math.abs(major) >= 1000) return `${(major / 1000).toFixed(1)}k`;
  return `${Math.round(major)}`;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile Money",
  UNKNOWN: "Unrecorded",
};

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const TOOLTIP_STYLE = {
  background: "var(--background2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-background2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4 text-muted-foreground", accent)} />
      </div>
      <span className="text-2xl font-bold tracking-tight tabular-nums">
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-sm border border-border bg-background2", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-muted-foreground">
      <BarChart3 className="h-10 w-10 opacity-20" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data, isLoading } = useGetReportOverviewQuery(orgId);

  if (isLoading || !data) {
    return (
      <div className="mx-auto min-h-full w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Your business at a glance.</p>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-sm" />
      </div>
    );
  }

  const {
    kpis,
    revenueVsSpend,
    salesByBranch,
    paymentMethods,
    inventoryByLocation,
    topProducts,
    topCustomers,
    topCategories,
    lowStock,
  } = data;

  const profitPositive = kpis.grossProfit >= 0;
  const marginPct = `${(kpis.grossMargin * 100).toFixed(1)}%`;

  const pieData = paymentMethods.map((m) => ({
    name: PAYMENT_LABELS[m.method] ?? m.method,
    value: m.total,
    count: m.count,
  }));
  const hasPayments = pieData.some((p) => p.value > 0);

  return (
    <div className="mx-auto min-h-full w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="text-muted-foreground">
          A deep look at sales, margins, inventory and customers.
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sales Revenue"
          value={formatMoney(kpis.salesRevenue)}
          icon={TrendingUp}
          accent="text-emerald-500"
          hint={`${kpis.salesCount} sales`}
        />
        <StatCard
          label="Gross Profit"
          value={formatMoney(kpis.grossProfit)}
          icon={Wallet}
          accent={profitPositive ? "text-emerald-500" : "text-destructive"}
          hint={`Margin ${marginPct} · COGS ${formatMoney(kpis.cogs)}`}
        />
        <StatCard
          label="Avg Order Value"
          value={formatMoney(kpis.averageOrderValue)}
          icon={Receipt}
          hint="per sale"
        />
        <StatCard
          label="Inventory Value"
          value={formatMoney(kpis.inventoryValue)}
          icon={Boxes}
          hint={`${kpis.inventoryUnits.toLocaleString()} units at cost`}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Purchase Spend"
          value={formatMoney(kpis.purchaseSpend)}
          icon={ShoppingCart}
          hint={`${kpis.purchaseCount} purchases`}
        />
        <StatCard
          label="Receivables"
          value={formatMoney(kpis.receivables)}
          icon={HandCoins}
          accent={kpis.receivables > 0 ? "text-amber-500" : undefined}
          hint="owed by customers"
        />
        <StatCard
          label="Returns"
          value={formatMoney(kpis.returnsTotal)}
          icon={Undo2}
          accent={kpis.returnsTotal > 0 ? "text-amber-500" : undefined}
          hint="refunded to date"
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(kpis.lowStockCount)}
          icon={AlertTriangle}
          accent={kpis.lowStockCount > 0 ? "text-amber-500" : undefined}
          hint={`${kpis.productCount} products`}
        />
      </div>

      {/* Revenue vs Spend */}
      <Panel title="Revenue vs Spend — last 14 days" icon={LineChart}>
        {revenueVsSpend.every((p) => p.revenue === 0 && p.spend === 0) ? (
          <EmptyChart label="No sales or purchases in this period" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={revenueVsSpend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                minTickGap={16}
              />
              <YAxis
                tickFormatter={compactMoney}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "var(--foreground)" }}
                labelFormatter={(d) => shortDate(d as string)}
                formatter={(value: any, name: any) => [
                  formatMoney(Number(value)),
                  name === "revenue" ? "Revenue" : "Spend",
                ]}
              />
              <Legend
                formatter={(v) => (v === "revenue" ? "Revenue" : "Spend")}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#revFill)"
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="var(--chart-4)"
                strokeWidth={2}
                fill="url(#spendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Sales by branch + Payment mix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Sales by Branch" icon={Store}>
          {salesByBranch.length === 0 ? (
            <EmptyChart label="No sales yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={salesByBranch}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={compactMoney}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted-foreground)", opacity: 0.06 }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: any) => [formatMoney(Number(value)), "Revenue"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {salesByBranch.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Payment Methods" icon={CreditCard}>
          {!hasPayments ? (
            <EmptyChart label="No sales yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="var(--background2)"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: any, _n: any, item: any) => [
                    `${formatMoney(Number(value))} · ${item?.payload?.count ?? 0} sales`,
                    item?.payload?.name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* Inventory by location + Top categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Inventory Value by Location" icon={Warehouse}>
          {inventoryByLocation.length === 0 ? (
            <EmptyChart label="No stock yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={inventoryByLocation}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={compactMoney}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted-foreground)", opacity: 0.06 }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: any, _n: any, item: any) => [
                    `${formatMoney(Number(value))} · ${item?.payload?.units ?? 0} units`,
                    "Value",
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} fill="var(--chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top Categories" icon={FolderTree}>
          {topCategories.length === 0 ? (
            <EmptyChart label="No sales yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={topCategories}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  tickFormatter={compactMoney}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted-foreground)", opacity: 0.06 }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: any) => [formatMoney(Number(value)), "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {topCategories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* Top products + Top customers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Top Products" icon={Package}>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="font-medium">{p.name}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        {p.variantName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(p.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel title="Top Customers" icon={Crown}>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.orders}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(c.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      {/* Low stock */}
      <Panel
        title="Low Stock"
        icon={AlertTriangle}
        action={
          lowStock.length > 0 ? (
            <Badge variant="destructive">{lowStock.length}</Badge>
          ) : undefined
        }
      >
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Everything is well stocked. 🎉
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Qty / Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStock.map((l, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <span className="font-medium">{l.product}</span>{" "}
                    <span className="text-xs text-muted-foreground">
                      {l.variant}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {l.sku}
                  </TableCell>
                  <TableCell>{l.location}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="font-medium text-amber-500">
                      {l.quantity}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      / {l.reorderPoint}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
