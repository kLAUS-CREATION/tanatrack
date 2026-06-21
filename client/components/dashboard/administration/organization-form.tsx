"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
} from "@/lib/features/services/organization.api";
import { SubscriptionStatus } from "@/types/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CalendarDays,
  Clock,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export function OrganizationForm() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data: org, isLoading } = useGetOrganizationByIdQuery(orgId);
  const [updateOrganization, { isLoading: isSaving }] = useUpdateOrganizationMutation();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [timeZone, setTimeZone] = useState("");

  // Hydrate the form once the org loads.
  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setLogoUrl(org.logoUrl ?? "");
      setTimeZone(org.timeZone ?? "");
    }
  }, [org]);

  // Unsaved-changes flag drives the Save/Reset buttons' enabled state.
  const isDirty = useMemo(() => {
    if (!org) return false;
    return (
      name !== (org.name ?? "") ||
      logoUrl !== (org.logoUrl ?? "") ||
      timeZone !== (org.timeZone ?? "")
    );
  }, [org, name, logoUrl, timeZone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOrganization({
        id: orgId,
        body: { name, logoUrl: logoUrl || undefined, timeZone: timeZone || undefined },
      }).unwrap();
      toast.success("Organization updated");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update organization");
    }
  };

  const handleReset = () => {
    if (!org) return;
    setName(org.name ?? "");
    setLogoUrl(org.logoUrl ?? "");
    setTimeZone(org.timeZone ?? "");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!org) return null;

  const initials = org.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberCount = org.memberships?.length;
  const planName = org.subscription?.plan?.name;
  const status = org.subscription?.status;
  const createdAt = org.createdAt
    ? new Date(org.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Profile hero — uses the live form values so edits preview instantly. */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/40 dark:border-primary/20">
        {/* soft gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-20 rounded-2xl border border-primary/30 shadow-sm">
            {logoUrl && <AvatarImage src={logoUrl} alt={name} className="rounded-2xl object-cover" />}
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
              {initials ? (
                <span className="text-xl font-semibold">{initials}</span>
              ) : (
                <Building2 className="h-7 w-7" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight truncate">
                {name || "Untitled organization"}
              </h2>
              <StatusBadge active={org.isActive} status={status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {planName && (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> {planName} plan
                </span>
              )}
              {typeof memberCount === "number" && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {memberCount}{" "}
                  {memberCount === 1 ? "member" : "members"}
                </span>
              )}
              {timeZone && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {timeZone}
                </span>
              )}
              {createdAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Since {createdAt}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary/40 dark:border-primary/20"
      >
        <div className="border-b border-primary/40 dark:border-primary/20 p-5">
          <h3 className="font-semibold tracking-tight">Organization details</h3>
          <p className="text-sm text-muted-foreground">
            Changes preview in the card above before you save.
          </p>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-timezone">Time zone</Label>
            <Input
              id="org-timezone"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              placeholder="UTC"
            />
            <p className="text-xs text-muted-foreground">
              e.g. UTC, Africa/Addis_Ababa, America/New_York
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="org-logo">Logo URL</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-muted">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Input
                id="org-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-primary/40 dark:border-primary/20 p-5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({
  active,
  status,
}: {
  active: boolean;
  status?: SubscriptionStatus;
}) {
  if (!active) {
    return <Badge variant="destructive">Inactive</Badge>;
  }
  if (status === SubscriptionStatus.ONFREETRIAL) {
    return (
      <Badge variant="secondary" className="text-foreground">
        Free trial
      </Badge>
    );
  }
  if (status && status !== SubscriptionStatus.ACTIVE) {
    return (
      <Badge variant="outline" className="capitalize">
        {status.toLowerCase()}
      </Badge>
    );
  }
  return <Badge>Active</Badge>;
}
