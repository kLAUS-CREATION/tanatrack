"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
} from "@/lib/features/services/organization.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOrganization({
        id: orgId,
        body: { name, logoUrl: logoUrl || undefined, timeZone: timeZone || undefined },
      }).unwrap();
      toast.success("Organization updated successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update organization");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-16 w-full rounded-sm" />
        <Skeleton className="h-16 w-full rounded-sm" />
        <Skeleton className="h-16 w-full rounded-sm" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
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
        <Label htmlFor="org-logo">Logo URL</Label>
        <Input
          id="org-logo"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…/logo.png"
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

      <Button type="submit" disabled={isSaving} className="rounded-sm">
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
