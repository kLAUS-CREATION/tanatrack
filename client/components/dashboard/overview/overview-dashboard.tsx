"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Store,
  Warehouse,
  Truck,
  Contact,
  Users,
  ArrowUpRight,
  LayoutDashboard,
  TrendingUp,
  Crown,
  Package,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetEmployeesQuery } from "@/lib/features/services/membership.api";
import { useGetBranchesQuery } from "@/lib/features/services/branch.api";
import { useGetWarehousesQuery } from "@/lib/features/services/warehouse.api";
import { useGetSuppliersQuery } from "@/lib/features/services/supplier.api";
import { useGetCustomersQuery } from "@/lib/features/services/customer.api";
import { useGetReportOverviewQuery } from "@/lib/features/services/reports.api";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface StatDef {
  key: string;
  label: string;
  icon: LucideIcon;
  section: string;
  /** CSS custom property name, e.g. "--chart-1". */
  colorVar: string;
  count?: number;
  /** Whether this entity's data loaded successfully for the current member. */
  loaded: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Money tooltip (sales trend)                                                */
/* -------------------------------------------------------------------------- */

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-background2 px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {formatMoney(payload[0].value as number)}
      </p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-background2 px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} {payload[0].value === 1 ? "record" : "records"}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export function OverviewDashboard() {
  const params = useParams();
  const orgId = params.orgId as string;
  const lang = params.lang as string;
  const base = `/${lang}/organizations/${orgId}`;

  const { isLoading: accessLoading } = useOrgAccess(orgId);

  // Always-available to any member.
  const employees = useGetEmployeesQuery(orgId);
  const branches = useGetBranchesQuery(orgId);
  const warehouses = useGetWarehousesQuery(orgId);
  const suppliers = useGetSuppliersQuery(orgId);
  // May be permission-restricted (403 → isError) for plain members.
  const customers = useGetCustomersQuery(orgId);
  // Manager/admin only — drives the sales-trend chart + top products.
  const report = useGetReportOverviewQuery(orgId);

  const coreLoading =
    accessLoading ||
    employees.isLoading ||
    branches.isLoading ||
    warehouses.isLoading ||
    suppliers.isLoading;

  const showCustomers = !!customers.data && !customers.isError;
  const showReport = !!report.data && !report.isError;

  const stats: StatDef[] = useMemo(() => {
    const all: StatDef[] = [
      {
        key: "employees",
        label: "Team Members",
        icon: Contact,
        section: "employees",
        colorVar: "--chart-1",
        count: employees.data?.length,
        loaded: !employees.isError,
      },
      {
        key: "branches",
        label: "Branches",
        icon: Store,
        section: "branches",
        colorVar: "--chart-2",
        count: branches.data?.length,
        loaded: !branches.isError,
      },
      {
        key: "warehouses",
        label: "Warehouses",
        icon: Warehouse,
        section: "warehouses",
        colorVar: "--chart-3",
        count: warehouses.data?.length,
        loaded: !warehouses.isError,
      },
      {
        key: "suppliers",
        label: "Suppliers",
        icon: Truck,
        section: "suppliers",
        colorVar: "--chart-4",
        count: suppliers.data?.length,
        loaded: !suppliers.isError,
      },
      {
        key: "customers",
        label: "Customers",
        icon: Users,
        section: "customers",
        colorVar: "--chart-5",
        count: customers.data?.length,
        loaded: showCustomers,
      },
    ];
    return all.filter((s) => s.loaded);
  }, [
    employees.data,
    employees.isError,
    branches.data,
    branches.isError,
    warehouses.data,
    warehouses.isError,
    suppliers.data,
    suppliers.isError,
    customers.data,
    showCustomers,
  ]);

  const compositionData = useMemo(
    () =>
      stats
        .filter((s) => typeof s.count === "number")
        .map((s) => ({
          name: s.label,
          value: s.count as number,
          colorVar: s.colorVar,
        })),
    [stats],
  );

  const trendData = useMemo(
    () =>
      (report.data?.salesTrend ?? []).map((p) => ({
        date: new Date(p.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        total: p.total,
      })),
    [report.data],
  );

  const topCustomers = useMemo(
    () =>
      [...(customers.data ?? [])]
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5),
    [customers.data],
  );

  /* ---- Loading ---- */
  if (coreLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 p-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Dashboard Overview
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s, i) => (
          <Link
            key={s.key}
            href={`${base}/${s.section}`}
            style={{ animationDelay: `${i * 60}ms` }}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border/60 bg-background2 p-5",
              "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-border",
              "animate-in fade-in slide-in-from-bottom-3 fill-mode-both",
            )}
          >
            {/* tinted glow */}
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
              style={{ background: `var(${s.colorVar})` }}
            />
            <div className="flex items-start justify-between">
              <span
                className="grid h-11 w-11 place-items-center rounded-lg"
                style={{
                  background: `color-mix(in oklch, var(${s.colorVar}) 16%, transparent)`,
                  color: `var(${s.colorVar})`,
                }}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {s.count ?? "—"}
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {s.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div
        className={cn(
          "grid gap-4",
          showReport ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* Composition — visible to everyone */}
        <ChartCard
          title="Organization at a glance"
          subtitle="How your records break down"
          icon={BarChart3}
        >
          {compositionData.length === 0 ? (
            <EmptyChart label="No records yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={compositionData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted-foreground)", opacity: 0.06 }}
                  content={<CountTooltip />}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {compositionData.map((d) => (
                    <Cell key={d.name} fill={`var(${d.colorVar})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Sales trend — managers/admins only */}
        {showReport && (
          <ChartCard
            title="Sales trend"
            subtitle="Revenue over the last 14 days"
            icon={TrendingUp}
          >
            {trendData.length === 0 ? (
              <EmptyChart label="No sales recorded yet" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    minTickGap={16}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v) => `${(v / 100).toLocaleString()}`}
                  />
                  <Tooltip content={<MoneyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )}
      </div>

      {/* Lists */}
      {(showCustomers || showReport) && (
        <div
          className={cn(
            "grid gap-4",
            showCustomers && showReport ? "lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {showCustomers && (
            <ListCard
              title="Top customers"
              subtitle="By outstanding balance"
              icon={Crown}
              href={`${base}/customers`}
            >
              {topCustomers.length === 0 ? (
                <EmptyRow label="No customers yet" />
              ) : (
                topCustomers.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {c.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{i + 1} customer
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        c.balance > 0
                          ? "text-amber-600"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatMoney(c.balance)}
                    </span>
                  </div>
                ))
              )}
            </ListCard>
          )}

          {showReport && (
            <ListCard
              title="Top products"
              subtitle="Best sellers by revenue"
              icon={Package}
              href={`${base}/reports`}
            >
              {(report.data?.topProducts ?? []).length === 0 ? (
                <EmptyRow label="No sales recorded yet" />
              ) : (
                report.data!.topProducts.slice(0, 5).map((p, i) => (
                  <div
                    key={`${p.name}-${p.variantName}-${i}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.variantName} · {p.quantity} sold
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatMoney(p.revenue)}
                    </span>
                  </div>
                ))
              )}
            </ListCard>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Presentational helpers                                                     */
/* -------------------------------------------------------------------------- */

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background2 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-semibold leading-none text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ListCard({
  title,
  subtitle,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background2 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-semibold leading-none text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground">
      <BarChart3 className="h-10 w-10 opacity-20" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="px-2 py-6 text-center text-sm text-muted-foreground">{label}</p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-1">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[378px] rounded-xl" />
        <Skeleton className="h-[378px] rounded-xl" />
      </div>
    </div>
  );
}
