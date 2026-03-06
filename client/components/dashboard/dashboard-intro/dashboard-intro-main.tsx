"use client"

import React from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Plus,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  LayoutDashboard
} from "lucide-react";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";
import { useGetOrganizationsQuery } from "@/lib/features/services/organization.api";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscriptionStatus } from "@/types/organization";
import { cn } from "@/lib/utils";
import { PlanType } from "@/types/plans";

export default function DashboardIntroMain() {
  const { data: session } = useGetSessionQuery();
  const { data: organizations, isLoading } = useGetOrganizationsQuery();

  const user = session?.user;

  // Helper to calculate days remaining for trial
  const getTrialDaysLeft = (endsAt?: string) => {
    if (!endsAt) return 0;
    const diff = new Date(endsAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  return (
    <main className="w-[98%] lg:w-[95%] mx-auto h-full overflow-y-auto space-y-2 custom-scrollbar">

      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-background2 py-3">
        <div className="space-y-1 border w-full p-2 lg:p-3 rounded-lg">
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
            <span className="text-3xl lg:text-4xl font-satoshi font-bold tracking-[1px]">Welcome Back</span>
          </div>
          <h1 className="text-xl lg:text-2xl tracking-tight text-foreground-secondary font-medium">
            {user?.name || "Member"}
          </h1>
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-[2rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : organizations && organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {organizations.map((org) => {
              const trialDays = getTrialDaysLeft(org.subscription?.trialEndsAt);
              const isTrial = org.subscription?.status === SubscriptionStatus.ONFREETRIAL;
              const isPro = org.subscription?.plan?.type === PlanType.PRO;

              return (
                <Link
                  key={org.id}
                  href={`/dashboard/${org.id}`}
                  className="group relative"
                >
                  <div className={cn(
                    "h-full p-2 lg:p-4 rounded-xs border-2 border-primary/80 transition-all duration-500 flex flex-col justify-between",
                    "bg-background2 border-border hover:border-primary/20 hover:shadow-xs hover:shadow-primary/10",
                    "hover:-translate-y-1"
                  )}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div  className="rounded-full px-3 uppercase text-[10px] font-bold tracking-widest">
                            {org.subscription?.plan?.name || "No Plan"}
                          </div>
                          {isTrial && (
                            <div className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">
                              {trialDays} Days Left
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {org.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {org.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(org.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-4 border-t border-dashed">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                         <LayoutDashboard className="h-3 w-3" /> Go to Dashboard
                      </span>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
            <div className="h-20 w-20 bg-background rounded-3xl flex items-center justify-center shadow-inner mb-6">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">No organizations found</h2>
            <p className="text-muted-foreground max-w-xs text-center mt-2">
              You haven't created any workspaces yet. Start by creating one to manage your business.
            </p>
            <Link href="/dashboard/new" className="mt-8">
              <Button size="lg" className="rounded-full px-8">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
