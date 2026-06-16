"use client";

import React from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { useGetReportOverviewQuery } from "@/lib/features/services/reports.api";

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
    <div className="rounded-sm border border-border bg-background2 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4 text-muted-foreground", accent)} />
      </div>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default function ReportsPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data, isLoading } = useGetReportOverviewQuery(orgId);

  if (isLoading || !data) {
    return (
      <div className="w-full mx-auto min-h-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Your business at a glance.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-sm" />
      </div>
    );
  }

  const { kpis, salesTrend, topProducts, lowStock } = data;
  const trendMax = Math.max(1, ...salesTrend.map((p) => p.total));
  const profitPositive = kpis.grossProfit >= 0;

  return (
    <div className="w-full mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="text-muted-foreground">Your business at a glance.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
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
          hint={`COGS ${formatMoney(kpis.cogs)}`}
        />
        <StatCard
          label="Inventory Value"
          value={formatMoney(kpis.inventoryValue)}
          icon={Boxes}
          hint="at cost price"
        />
        <StatCard
          label="Purchase Spend"
          value={formatMoney(kpis.purchaseSpend)}
          icon={ShoppingCart}
          hint={`${kpis.purchaseCount} purchases`}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Products"
          value={String(kpis.productCount)}
          icon={Package}
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(kpis.lowStockCount)}
          icon={AlertTriangle}
          accent={kpis.lowStockCount > 0 ? "text-amber-500" : undefined}
        />
      </div>

      {/* Sales trend */}
      <div className="rounded-sm border border-border bg-background2 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Sales — last 14 days</h2>
        </div>
        <div className="flex items-end gap-1.5 h-40">
          {salesTrend.map((p) => (
            <div
              key={p.date}
              className="group flex-1 flex flex-col items-center justify-end h-full"
            >
              <div className="relative w-full flex justify-center">
                <span className="absolute -top-5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatMoney(p.total)}
                </span>
              </div>
              <div
                className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors min-h-[2px]"
                style={{ height: `${(p.total / trendMax) * 100}%` }}
              />
              <span className="mt-1 text-[10px] text-muted-foreground">
                {p.date.slice(8, 10)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top products + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-border bg-background2">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-semibold">Top Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No sales yet.</p>
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
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(p.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-sm border border-border bg-background2">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Low Stock</h2>
            {lowStock.length > 0 && (
              <Badge variant="destructive">{lowStock.length}</Badge>
            )}
          </div>
          {lowStock.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Everything is well stocked. 🎉
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
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
                    <TableCell>{l.location}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-amber-500 font-medium">
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
        </div>
      </div>
    </div>
  );
}
