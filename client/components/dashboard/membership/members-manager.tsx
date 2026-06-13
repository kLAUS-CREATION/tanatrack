"use client";

import React, { useMemo, useState } from "react";
import {
  useGetMembersQuery,
  useGetOrgRolesQuery,
  useSetMemberRoleMutation,
  useAssignBranchRoleMutation,
  useRemoveBranchRoleMutation,
  useAssignWarehouseRoleMutation,
  useRemoveWarehouseRoleMutation,
  IMember,
  OrganizationRole,
} from "@/lib/features/services/membership.api";
import { useGetBranchesQuery } from "@/lib/features/services/branch.api";
import { useGetWarehousesQuery } from "@/lib/features/services/warehouse.api";
import { Avatar as AvatarRoot, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Crown, Globe, Loader2, MapPin, Search, Store, Users, Warehouse } from "lucide-react";
import { toast } from "sonner";

const NO_ROLE = "__none__";

type RoleTab = "all" | "owners" | "employees";

export function MembersManager({ organizationId }: { organizationId: string }) {
  const { data: members, isLoading } = useGetMembersQuery(organizationId);
  const { data: roles } = useGetOrgRolesQuery(organizationId);

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [tab, setTab] = useState<RoleTab>("all");

  // Locations that actually have members assigned — used for the scope filter.
  const { branchOptions, warehouseOptions } = useMemo(() => {
    const branches = new Map<string, string>();
    const warehouses = new Map<string, string>();
    members?.forEach((m) => {
      m.branches.forEach((b) => b.branchId && branches.set(b.branchId, b.branchName ?? "Branch"));
      m.warehouses.forEach((w) => w.warehouseId && warehouses.set(w.warehouseId, w.warehouseName ?? "Warehouse"));
    });
    return {
      branchOptions: [...branches].map(([id, name]) => ({ id, name })),
      warehouseOptions: [...warehouses].map(([id, name]) => ({ id, name })),
    };
  }, [members]);

  // Apply search + scope first; role tabs are counted from this base.
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (members ?? []).filter((m) => {
      if (q && !(m.user.name?.toLowerCase().includes(q) || m.user.email?.toLowerCase().includes(q))) {
        return false;
      }
      if (scope === "org") {
        return m.roleType === OrganizationRole.OWNER || !!m.roleId;
      }
      if (scope.startsWith("branch:")) {
        return m.branches.some((b) => b.branchId === scope.slice(7));
      }
      if (scope.startsWith("warehouse:")) {
        return m.warehouses.some((w) => w.warehouseId === scope.slice(10));
      }
      return true;
    });
  }, [members, search, scope]);

  const counts = useMemo(
    () => ({
      all: base.length,
      owners: base.filter((m) => m.roleType === OrganizationRole.OWNER).length,
      employees: base.filter((m) => m.roleType !== OrganizationRole.OWNER).length,
    }),
    [base],
  );

  const visible = base.filter((m) =>
    tab === "all" ? true : tab === "owners" ? m.roleType === OrganizationRole.OWNER : m.roleType !== OrganizationRole.OWNER,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + scope */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="sm:w-60">
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            <SelectItem value="org">Org-wide roles</SelectItem>
            {branchOptions.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Branches</SelectLabel>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.id} value={`branch:${b.id}`}>{b.name}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
            {warehouseOptions.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Warehouses</SelectLabel>
                  {warehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={`warehouse:${w.id}`}>{w.name}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Role tabs */}
      <div className="inline-flex rounded-lg border border-primary/40 dark:border-primary/20 p-0.5 text-sm">
        <TabButton active={tab === "all"} onClick={() => setTab("all")} label="All" count={counts.all} />
        <TabButton active={tab === "owners"} onClick={() => setTab("owners")} label="Owners" count={counts.owners} />
        <TabButton active={tab === "employees"} onClick={() => setTab("employees")} label="Employees" count={counts.employees} />
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-8 w-8 mb-3 text-muted-foreground/60" />
          <p className="font-medium">No members found</p>
          <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-primary/40 dark:border-primary/20 divide-y divide-primary/40 dark:divide-primary/20">
          {visible.map((member) => (
            <MemberRow
              key={member.id}
              organizationId={organizationId}
              member={member}
              roles={roles ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 transition-colors",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label} <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

function MemberRow({
  organizationId,
  member,
  roles,
}: {
  organizationId: string;
  member: IMember;
  roles: { id: string; name: string }[];
}) {
  const isOwner = member.roleType === OrganizationRole.OWNER;
  const [setMemberRole, { isLoading: savingRole }] = useSetMemberRoleMutation();

  const initials = member.user.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleGlobalRole = async (value: string) => {
    try {
      await setMemberRole({
        organizationId,
        membershipId: member.id,
        roleId: value === NO_ROLE ? null : value,
      }).unwrap();
      toast.success("Member role updated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update role");
    }
  };

  const locationCount = member.branches.length + member.warehouses.length;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <AvatarRoot className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
            {initials || "?"}
          </AvatarFallback>
        </AvatarRoot>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{member.user.name}</p>
            {isOwner && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Crown className="h-3 w-3" /> Owner
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>

          {/* At-a-glance scope chips */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {isOwner ? (
              <Chip icon={<Globe className="h-3 w-3" />}>Org-wide · full access</Chip>
            ) : (
              <>
                {member.roleName && <Chip icon={<Globe className="h-3 w-3" />}>{member.roleName}</Chip>}
                {member.branches.map((b) => (
                  <Chip key={b.branchId} icon={<Store className="h-3 w-3" />}>
                    {b.branchName}{b.roleName ? ` · ${b.roleName}` : ""}
                  </Chip>
                ))}
                {member.warehouses.map((w) => (
                  <Chip key={w.warehouseId} icon={<Warehouse className="h-3 w-3" />}>
                    {w.warehouseName}{w.roleName ? ` · ${w.roleName}` : ""}
                  </Chip>
                ))}
                {!member.roleName && locationCount === 0 && (
                  <span className="text-xs text-muted-foreground">No role assigned</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {!isOwner && (
        <div className="flex items-center gap-2 shrink-0 md:pl-3">
          <Select value={member.roleId ?? NO_ROLE} onValueChange={handleGlobalRole} disabled={savingRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="No org role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ROLE}>No org role</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <LocationAccessSheet
            organizationId={organizationId}
            member={member}
            roles={roles}
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5">
                <MapPin className="h-4 w-4" />
                {locationCount > 0 ? locationCount : "Locations"}
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
      {icon}
      <span className="truncate max-w-[180px]">{children}</span>
    </span>
  );
}

function LocationAccessSheet({
  organizationId,
  member,
  roles,
  trigger,
}: {
  organizationId: string;
  member: IMember;
  roles: { id: string; name: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: branches } = useGetBranchesQuery(organizationId, { skip: !open });
  const { data: warehouses } = useGetWarehousesQuery(organizationId, { skip: !open });

  const [assignBranch] = useAssignBranchRoleMutation();
  const [removeBranch] = useRemoveBranchRoleMutation();
  const [assignWarehouse] = useAssignWarehouseRoleMutation();
  const [removeWarehouse] = useRemoveWarehouseRoleMutation();

  const branchRoleFor = (branchId: string) =>
    member.branches.find((b) => b.branchId === branchId)?.roleId ?? null;
  const warehouseRoleFor = (warehouseId: string) =>
    member.warehouses.find((w) => w.warehouseId === warehouseId)?.roleId ?? null;

  const onBranchChange = async (branchId: string, value: string) => {
    try {
      if (value === NO_ROLE) {
        await removeBranch({ organizationId, membershipId: member.id, branchId }).unwrap();
      } else {
        await assignBranch({ organizationId, membershipId: member.id, branchId, roleId: value }).unwrap();
      }
      toast.success("Branch access updated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update branch access");
    }
  };

  const onWarehouseChange = async (warehouseId: string, value: string) => {
    try {
      if (value === NO_ROLE) {
        await removeWarehouse({ organizationId, membershipId: member.id, warehouseId }).unwrap();
      } else {
        await assignWarehouse({ organizationId, membershipId: member.id, warehouseId, roleId: value }).unwrap();
      }
      toast.success("Warehouse access updated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update warehouse access");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Location access — {member.user.name}</SheetTitle>
          <SheetDescription>
            Grant a role at a specific branch or warehouse. This only applies to that location.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8 px-1">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" /> Branches
            </div>
            {!branches?.length ? (
              <p className="text-sm text-muted-foreground">No branches in this organization.</p>
            ) : (
              branches.map((b) => (
                <LocationRow
                  key={b.id}
                  name={b.name}
                  roleId={branchRoleFor(b.id)}
                  roles={roles}
                  onChange={(v) => onBranchChange(b.id, v)}
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Warehouse className="h-4 w-4" /> Warehouses
            </div>
            {!warehouses?.length ? (
              <p className="text-sm text-muted-foreground">No warehouses in this organization.</p>
            ) : (
              warehouses.map((w) => (
                <LocationRow
                  key={w.id}
                  name={w.name}
                  roleId={warehouseRoleFor(w.id)}
                  roles={roles}
                  onChange={(v) => onWarehouseChange(w.id, v)}
                />
              ))
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LocationRow({
  name,
  roleId,
  roles,
  onChange,
}: {
  name: string;
  roleId: string | null;
  roles: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="font-medium truncate">{name}</span>
      <Select value={roleId ?? NO_ROLE} onValueChange={onChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="No access" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_ROLE}>No access</SelectItem>
          {roles.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
