"use client"

import React from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  ShieldCheck,
  Clock,
  LayoutDashboard,
  Crown,
  Users,
} from "lucide-react";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";
import { useGetOrganizationsQuery } from "@/lib/features/services/organization.api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrganizationRole, SubscriptionStatus, IOrganization } from "@/types/organization";
import { cn } from "@/lib/utils";

// Helper to calculate days remaining for a trial.
const getTrialDaysLeft = (endsAt?: string) => {
  if (!endsAt) return 0;
  const diff = new Date(endsAt).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

export default function DashboardIntroMain() {
  const { data: session } = useGetSessionQuery();
  const { data: organizations, isLoading } = useGetOrganizationsQuery();

  const user = session?.user;

  // Split organizations into the ones the user owns and the ones they were
  // invited to (any role other than OWNER).
  const owned = organizations?.filter((org) => org.roleType === OrganizationRole.OWNER) ?? [];
  const shared = organizations?.filter((org) => org.roleType !== OrganizationRole.OWNER) ?? [];

  return (
    <main className="w-[98%] lg:w-[95%] mx-auto overflow-y-auto space-y-4 custom-scrollbar">

      <section className="bg-linear-to-r from-primary/3 to-secondary/5 dark:from-primary/1 dark:to-secondary/2 flex flex-col md:flex-row justify-between items-center gap-4 bg-background2 p-2 border border-primary/40 dark:border-primary/20 rounded-sm">
        <div className="">
          <h1 className="text-xl lg:text-2xl font-normal mb-2 tracking-[1px] text-foreground-secondary">
            Welcome back,{" "}
            <span className="text-foreground font-bold">{user?.name || "Our Customer"}</span>! 👋
          </h1>
          <p className="text-muted-foreground">
            Manage All Your business workspaces in one place.
          </p>
        </div>

        <Link href={'/organizations/new'}>
          <Button className="size-full rounded-sm"> New organization </Button>
        </Link>
      </section>

      {isLoading ? (
        <OrgGridSkeleton />
      ) : (
        <Tabs defaultValue="owned" className="w-full">
          <TabsList>
            <TabsTrigger value="owned" className="gap-2">
              <Crown className="h-4 w-4" />
              My Organizations
              <CountBadge count={owned.length} />
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2">
              <Users className="h-4 w-4" />
              Shared with Me
              <CountBadge count={shared.length} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            {owned.length > 0 ? (
              <OrgGrid organizations={owned} />
            ) : (
              <EmptyState
                title="No organizations yet"
                description="You haven't created any workspaces yet. Start by creating one to manage your business."
                action={
                  <Link href="/organizations/new">
                    <Button size="lg">Get Started</Button>
                  </Link>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="shared">
            {shared.length > 0 ? (
              <OrgGrid organizations={shared} />
            ) : (
              <EmptyState
                title="No shared organizations"
                description="Organizations you've been invited to will appear here once you accept an invitation."
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

function OrgGrid({ organizations }: { organizations: IOrganization[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3">
      {organizations.map((org) => (
        <OrgCard key={org.id} org={org} />
      ))}
    </div>
  );
}

function OrgCard({ org }: { org: IOrganization }) {
  const trialDays = getTrialDaysLeft(org.subscription?.trialEndsAt);
  const isTrial = org.subscription?.status === SubscriptionStatus.ONFREETRIAL;

  return (
    <Link href={`/dashboard/${org.id}`} className="group relative">
      <div className={cn(
        "h-full p-2 lg:p-4 rounded-xs border-2 border-primary/80 transition-all duration-500 flex flex-col justify-between",
        "bg-background2 border-border hover:border-primary/20 rounded-sm",
      )}>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Building2 className="h-6 w-6" />
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-full px-3 uppercase text-[10px] font-bold tracking-widest">
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
            <h2 className="text-xl font-bold  transition-colors">
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
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center transition-all">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function OrgGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 rounded-[2rem] bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xs">
      <div className="h-20 w-20 bg-background rounded-3xl flex items-center justify-center shadow-inner mb-6">
        <Building2 className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-xl text-center mt-2">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
