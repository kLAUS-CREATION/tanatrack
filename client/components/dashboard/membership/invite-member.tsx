"use client"

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useInviteMemberMutation,
  useGetOrgRolesQuery,
  useGetAssignableLocationsQuery,
  InviteLocationInput,
  RoleKind,
} from "@/lib/features/services/membership.api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Mail,
  Building2,
  Warehouse,
  Loader2,
  Check,
  Globe,
  MapPin,
  ShieldOff,
} from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  roleId: z.string().min(1, "Select a role"),
});

type InviteValues = z.infer<typeof inviteSchema>;

export function InviteMemberForm({
  organizationId,
  onInvited,
}: {
  organizationId: string;
  onInvited?: () => void;
}) {
  const [invite, { isLoading: isSending }] = useInviteMemberMutation();
  const { data: roles } = useGetOrgRolesQuery(organizationId);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", roleId: "" },
  });

  // Which kind of role the inviter is picking (chosen before the role itself).
  const [roleKind, setRoleKind] = useState<RoleKind | null>(null);

  // Selected locations (only meaningful for a LOCAL role).
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [warehouseIds, setWarehouseIds] = useState<string[]>([]);

  const roleId = form.watch("roleId");
  const selectedRole = useMemo(
    () => (roleId ? roles?.find((r) => r.id === roleId) : undefined),
    [roleId, roles],
  );
  const isLocal = selectedRole?.kind === RoleKind.LOCAL;

  const globalRoles = useMemo(() => roles?.filter((r) => r.kind === RoleKind.GLOBAL) ?? [], [roles]);
  const localRoles = useMemo(() => roles?.filter((r) => r.kind === RoleKind.LOCAL) ?? [], [roles]);
  const rolesForKind = roleKind === RoleKind.LOCAL ? localRoles : roleKind === RoleKind.GLOBAL ? globalRoles : [];

  // Choosing a kind clears any previously-selected role (and its locations).
  const selectKind = (kind: RoleKind) => {
    setRoleKind(kind);
    form.setValue("roleId", "");
    setBranchIds([]);
    setWarehouseIds([]);
  };

  // Only LOCAL roles need a location, so only fetch then.
  const { data: locations, isLoading: locationsLoading } = useGetAssignableLocationsQuery(
    organizationId,
    { skip: !isLocal },
  );

  // Reset the location selection whenever the role changes.
  useEffect(() => {
    setBranchIds([]);
    setWarehouseIds([]);
  }, [roleId]);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const branches = locations?.branches ?? [];
  const warehouses = locations?.warehouses ?? [];
  const noLocationsExist = isLocal && !locationsLoading && branches.length === 0 && warehouses.length === 0;
  const selectedCount = branchIds.length + warehouseIds.length;
  const needsLocation = isLocal && selectedCount === 0;
  const submitDisabled = isSending || !roleId || noLocationsExist || needsLocation;

  const onSubmit = async (values: InviteValues) => {
    if (isLocal && selectedCount === 0) {
      toast.error("Select at least one branch or warehouse for this location-based role");
      return;
    }

    const locationsPayload: InviteLocationInput[] | undefined = isLocal
      ? [...branchIds.map((branchId) => ({ branchId })), ...warehouseIds.map((warehouseId) => ({ warehouseId }))]
      : undefined;

    try {
      await invite({
        organizationId,
        body: { email: values.email, roleId: values.roleId, locations: locationsPayload },
      }).unwrap();
      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
      setRoleKind(null);
      setBranchIds([]);
      setWarehouseIds([]);
      onInvited?.();
    } catch (e: any) {
      toast.error(e.data?.message || "Failed to send invitation");
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold tracking-tight">Invite a new employee</h3>
        <p className="text-muted-foreground">
          Send an invitation and choose what they can access.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Section step={1} title="Who are you inviting?">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="name@company.com"
                        className="pl-9 h-11"
                        autoComplete="off"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section
            step={2}
            title="What kind of role?"
            subtitle="Org-wide roles apply everywhere. Per-location roles apply only to the branches and warehouses you pick."
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <KindCard
                  selected={roleKind === RoleKind.GLOBAL}
                  onSelect={() => selectKind(RoleKind.GLOBAL)}
                  icon={<Globe className="h-5 w-5" />}
                  title="Org-wide role"
                  desc="Applies across the whole organization"
                  count={globalRoles.length}
                />
                <KindCard
                  selected={roleKind === RoleKind.LOCAL}
                  onSelect={() => selectKind(RoleKind.LOCAL)}
                  icon={<MapPin className="h-5 w-5" />}
                  title="Per-location role"
                  desc="Limited to chosen branches & warehouses"
                  count={localRoles.length}
                />
              </div>

              {roleKind && (
                <div className="space-y-2.5">
                  <p className="text-sm text-muted-foreground">
                    Choose a {roleKind === RoleKind.LOCAL ? "per-location" : "org-wide"} role
                  </p>
                  {rolesForKind.length === 0 ? (
                    <EmptyHint
                      icon={<ShieldOff className="h-6 w-6" />}
                      title={`No ${roleKind === RoleKind.LOCAL ? "per-location" : "org-wide"} roles yet`}
                      desc="Create one in the Roles & Permissions settings first."
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rolesForKind.map((r) => (
                        <RoleCard
                          key={r.id}
                          selected={roleId === r.id}
                          onSelect={() => form.setValue("roleId", r.id, { shouldValidate: true })}
                          name={r.name}
                          memberCount={r._count?.memberships}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          {isLocal && (
            <Section
              step={3}
              title="Which locations can they access?"
              subtitle={`The "${selectedRole?.name}" role is applied at each location you select.`}
            >
              {locationsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading locations…
                </div>
              ) : noLocationsExist ? (
                <EmptyHint
                  icon={<Building2 className="h-6 w-6" />}
                  title="No locations yet"
                  desc="Create a branch or warehouse first before assigning a per-location role."
                />
              ) : (
                <div className="space-y-5">
                  <LocationGroup
                    icon={<Building2 className="h-4 w-4" />}
                    label="Branches"
                    options={branches}
                    selected={branchIds}
                    onToggle={(id) => toggle(branchIds, setBranchIds, id)}
                    onToggleAll={(all) => setBranchIds(all ? branches.map((b) => b.id) : [])}
                  />
                  <LocationGroup
                    icon={<Warehouse className="h-4 w-4" />}
                    label="Warehouses"
                    options={warehouses}
                    selected={warehouseIds}
                    onToggle={(id) => toggle(warehouseIds, setWarehouseIds, id)}
                    onToggleAll={(all) => setWarehouseIds(all ? warehouses.map((w) => w.id) : [])}
                  />
                </div>
              )}
            </Section>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" className="gap-2" disabled={submitDisabled}>
              {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
            {!noLocationsExist && needsLocation && (
              <p className="text-xs text-muted-foreground">Select at least one location to continue.</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

/* ------------------------------- Sub-components ------------------------------ */

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground">
          {step}
        </span>
        <div>
          <h4 className="font-medium leading-tight">{title}</h4>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="pl-0 sm:pl-9">{children}</div>
    </div>
  );
}

function KindCard({
  selected,
  onSelect,
  icon,
  title,
  desc,
  count,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        "hover:bg-muted/40",
        selected ? "border-primary/80 dark:border-primary/20 bg-primary/5" : "border-border",
      )}
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {selected && <Check className="h-4 w-4 text-primary" />}
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {count} role{count === 1 ? "" : "s"}
        </p>
      </div>
    </button>
  );
}

function RoleCard({
  selected,
  onSelect,
  name,
  memberCount,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  memberCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        "hover:bg-muted/40",
        selected ? "border-primary/80 dark:border-primary/20 bg-primary/5" : "border-border",
      )}
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{name}</p>
        {typeof memberCount === "number" && (
          <p className="text-xs text-muted-foreground">
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </p>
        )}
      </div>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

function LocationGroup({
  icon,
  label,
  options,
  selected,
  onToggle,
  onToggleAll,
}: {
  icon: React.ReactNode;
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: (all: boolean) => void;
}) {
  if (options.length === 0) return null;
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.id));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
          <span className="text-xs tabular-nums">
            {selected.length}/{options.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleAll(!allSelected)}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const isOn = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                isOn
                  ? "border-primary/80 dark:border-primary/20 bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {isOn && <Check className="h-3.5 w-3.5 text-primary" />}
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyHint({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <div className="mx-auto mb-2 flex justify-center text-muted-foreground/60">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
