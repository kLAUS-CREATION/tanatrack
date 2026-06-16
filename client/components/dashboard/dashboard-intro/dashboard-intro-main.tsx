"use client"

import React from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  ShieldCheck,
  Clock,
  Crown,
  Users,
  Search,
  Pin,
  PinOff,
  Plus,
  X,
} from "lucide-react";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";
import { useGetOrganizationsQuery } from "@/lib/features/services/organization.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrganizationRole, SubscriptionStatus, IOrganization } from "@/types/organization";
import { cn } from "@/lib/utils";

const PINNED_STORAGE_KEY = "tt:pinned-orgs";

type StatusFilter = "all" | "active" | "trial";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "On trial" },
];

// Helper to calculate days remaining for a trial.
const getTrialDaysLeft = (endsAt?: string) => {
  if (!endsAt) return 0;
  const diff = new Date(endsAt).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const isOnTrial = (org: IOrganization) =>
  org.subscription?.status === SubscriptionStatus.ONFREETRIAL;

// Persist pinned organization ids in localStorage (no backend for this yet).
function usePinnedOrgs() {
  const [pinned, setPinned] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PINNED_STORAGE_KEY);
      if (raw) setPinned(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const toggle = React.useCallback((id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write failures (e.g. private mode)
      }
      return next;
    });
  }, []);

  return { pinned, toggle };
}

export default function DashboardIntroMain() {
  const { data: session } = useGetSessionQuery();
  const { data: organizations, isLoading } = useGetOrganizationsQuery();
  const { pinned, toggle: togglePin } = usePinnedOrgs();

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");

  const user = session?.user;

  // Split organizations into the ones the user owns and the ones they were
  // invited to (any role other than OWNER).
  const owned = organizations?.filter((org) => org.roleType === OrganizationRole.OWNER) ?? [];
  const shared = organizations?.filter((org) => org.roleType !== OrganizationRole.OWNER) ?? [];

  // Apply search + status filter, then float pinned organizations to the top.
  const applyView = React.useCallback(
    (list: IOrganization[]) => {
      const q = query.trim().toLowerCase();
      const filtered = list.filter((org) => {
        const matchesQuery =
          !q ||
          org.name.toLowerCase().includes(q) ||
          (org.subscription?.plan?.name?.toLowerCase().includes(q) ?? false);
        const matchesStatus =
          status === "all" ||
          (status === "active" && org.isActive) ||
          (status === "trial" && isOnTrial(org));
        return matchesQuery && matchesStatus;
      });

      return [...filtered].sort((a, b) => {
        const ap = pinned.includes(a.id) ? 1 : 0;
        const bp = pinned.includes(b.id) ? 1 : 0;
        return bp - ap;
      });
    },
    [query, status, pinned],
  );

  const ownedView = applyView(owned);
  const sharedView = applyView(shared);

  return (
    <main className="w-full overflow-y-auto py-6 space-y-8 custom-scrollbar">
      {/* Welcome banner */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            Welcome back,{" "}
            <span className="text-primary">{user?.name || "there"}</span> 👋
          </h1>
          <p className="text-foreground-secondary text-base lg:text-lg mt-1">
            Manage all your business workspaces in one place.
          </p>
        </div>

        <Link href="/organizations/new">
          <Button className="rounded-md gap-2 bg-primary/90">
            <Plus className="size-4" />
            New organization
          </Button>
        </Link>
      </section>

      {/* Toolbar: search + status filter */}
      <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="inline-flex items-center rounded-md border border-primary/20 dark:border-primary/15 bg-background2 p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-[5px] transition-colors",
                status === f.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <OrgGridSkeleton />
      ) : (
        <Tabs defaultValue="owned" className="w-full">
          <TabsList>
            <TabsTrigger value="owned" className="gap-2">
              <Crown className="h-4 w-4" />
              My Organizations
              <CountBadge count={ownedView.length} />
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2">
              <Users className="h-4 w-4" />
              Shared with Me
              <CountBadge count={sharedView.length} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            {ownedView.length > 0 ? (
              <OrgGrid organizations={ownedView} pinned={pinned} onTogglePin={togglePin} />
            ) : owned.length > 0 ? (
              <NoMatchState onReset={() => { setQuery(""); setStatus("all"); }} />
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
            {sharedView.length > 0 ? (
              <OrgGrid organizations={sharedView} pinned={pinned} onTogglePin={togglePin} />
            ) : shared.length > 0 ? (
              <NoMatchState onReset={() => { setQuery(""); setStatus("all"); }} />
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

function OrgGrid({
  organizations,
  pinned,
  onTogglePin,
}: {
  organizations: IOrganization[];
  pinned: string[];
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
      {organizations.map((org, i) => (
        <OrgCard
          key={org.id}
          org={org}
          index={i}
          isPinned={pinned.includes(org.id)}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

function OrgCard({
  org,
  index,
  isPinned,
  onTogglePin,
}: {
  org: IOrganization;
  index: number;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
}) {
  const trialDays = getTrialDaysLeft(org.subscription?.trialEndsAt);
  const trial = isOnTrial(org);

  return (
    <div
      className={cn(
        "relative p-5 rounded-xs border bg-background2 group transition-all duration-300",
        "hover:border-primary/40 hover:shadow-sm hover:shadow-primary/5 hover:-translate-y-0.5",
        "animate-in fade-in slide-in-from-bottom-6",
        isPinned
          ? "border-primary/40 dark:border-primary/30"
          : "border-primary/20 dark:border-primary/15",
      )}
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: "backwards" }}
    >
      <Link
        href={`/organizations/${org.id}`}
        aria-label={`Open ${org.name}`}
        className="absolute inset-0 z-10 rounded-xs"
      />

      {/* Pin button */}
      <button
        type="button"
        onClick={() => onTogglePin(org.id)}
        aria-label={isPinned ? `Unpin ${org.name}` : `Pin ${org.name}`}
        aria-pressed={isPinned}
        className={cn(
          "absolute top-4 right-4 z-20 flex size-7 items-center justify-center rounded-md transition-colors",
          isPinned
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100",
        )}
      >
        {isPinned ? <Pin className="size-4 fill-primary" /> : <PinOff className="size-4" />}
      </button>

      {/* Card content sits below the overlay. */}
      <div className="relative z-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-md bg-primary/20 flex items-center justify-center text-primary  transition-colors duration-300">
            <Building2 className="size-5" />
          </div>
          {/* leave room for the pin button on the right */}
          <span className="mr-9 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {org.subscription?.plan?.name || "No plan"}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {org.name}
          </h3>
          <div className="flex items-center gap-4 mt-1.5 text-muted-foreground text-xs font-medium">
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

        {trial && (
          <span className="w-fit rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2.5 py-0.5 text-[11px] font-medium">
            {trialDays} day{trialDays === 1 ? "" : "s"} left on trial
          </span>
        )}

        <div className="mt-1 flex items-center justify-between pt-3 border-t border-dashed border-primary/15">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
            Open workspace
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </div>
  );
}

function OrgGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-44 rounded-xs border border-primary/15 bg-background2 animate-pulse"
        />
      ))}
    </div>
  );
}

function NoMatchState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-5">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No organizations match</h3>
      <p className="text-muted-foreground text-sm max-w-sm mt-1">
        Try a different search term or clear the filters.
      </p>
      <Button variant="outline" size="sm" className="mt-5" onClick={onReset}>
        Clear filters
      </Button>
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
