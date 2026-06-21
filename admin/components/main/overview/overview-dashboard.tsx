"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  Globe,
  Layers,
  LayoutGrid,
  Package,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useGetPlansQuery } from "@/lib/features/services/plans.api";
import { useGetFeaturesQuery } from "@/lib/features/services/feature.api";
import { PlanType, type IPlan } from "@/types/plans";
import { FeatureCategory, type IFeature } from "@/types/features";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { CardGridSkeleton } from "@/components/dashboard/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A single headline metric tile. */
function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  chart,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  chart: number; // 1..5 → var(--chart-N)
  index: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-background2 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="grid h-11 w-11 place-items-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in oklch, var(--chart-${chart}) 14%, transparent)`,
            color: `var(--chart-${chart})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground-secondary">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background2 p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground-secondary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function money(plan: IPlan) {
  if (!plan.monthlyPrice) return "Free";
  return `${plan.currency} ${(plan.monthlyPrice / 100).toLocaleString()}`;
}

export default function OverviewDashboard() {
  const { data: plans, isLoading: plansLoading } = useGetPlansQuery();
  const { data: features, isLoading: featuresLoading } = useGetFeaturesQuery();

  const loading = plansLoading || featuresLoading;

  const planList: IPlan[] = plans ?? [];
  const featureList: IFeature[] = features ?? [];

  const paidCount = planList.filter((p) => p.type === PlanType.PRO).length;
  const publicCount = planList.filter((p) => p.isPublic).length;
  const totalLinks = planList.reduce(
    (sum, p) => sum + (p.planFeatures?.length ?? 0),
    0,
  );
  const avgPerPlan = planList.length
    ? Math.round(totalLinks / planList.length)
    : 0;

  // Group features by category for the breakdown bars.
  const byCategory = Object.values(FeatureCategory)
    .map((cat) => ({
      cat,
      count: featureList.filter((f) => f.category === cat).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCat = byCategory[0]?.count ?? 1;

  // Plans sorted for the mini-list, cheapest first.
  const sortedPlans = [...planList].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  return (
    <PageShell
      title="Overview"
      subtitle="Catalog health across your subscription plans and features."
      actionCount={0}
      loading={loading}
      skeleton={
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <CardGridSkeleton count={5} itemClassName="h-[132px]" className="col-span-full grid-cols-2 lg:grid-cols-5" />
          </div>
          <CardGridSkeleton count={2} itemClassName="h-[260px]" className="lg:grid-cols-2" />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard index={0} chart={1} icon={CreditCard} label="Total Plans" value={planList.length} hint={`${paidCount} paid`} />
          <StatCard index={1} chart={2} icon={Globe} label="Public Plans" value={publicCount} hint="visible on pricing" />
          <StatCard index={2} chart={3} icon={LayoutGrid} label="Features" value={featureList.length} hint="in catalog" />
          <StatCard index={3} chart={4} icon={Layers} label="Feature Links" value={totalLinks} hint="plan ↔ feature" />
          <StatCard index={4} chart={5} icon={Package} label="Avg / Plan" value={avgPerPlan} hint="features per plan" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Features by category */}
          <SectionCard
            icon={Sparkles}
            title="Features by category"
            subtitle="Distribution across the feature catalog"
            action={
              <Link
                href="/features"
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground-secondary hover:text-primary transition-colors"
              >
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {byCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No features yet.
              </p>
            ) : (
              <div className="space-y-3">
                {byCategory.map(({ cat, count }) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium capitalize text-foreground-secondary">
                        {cat.toLowerCase()}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all duration-500"
                        style={{ width: `${(count / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Plans mini-list */}
          <SectionCard
            icon={CreditCard}
            title="Plans"
            subtitle="Your configured pricing tiers"
            action={
              <Link
                href="/plans"
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground-secondary hover:text-primary transition-colors"
              >
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {sortedPlans.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No plans yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {sortedPlans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {plan.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {plan.planFeatures?.length ?? 0} features · {money(plan)}/mo
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          plan.isActive
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {plan.isPublic && (
                        <Badge variant="outline" className="text-[10px]">
                          Public
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
