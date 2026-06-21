"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useGetPermissionDefinitionsQuery,
  useGetOrgRolesQuery,
  useGetRoleDetailsQuery,
  useUpdateRoleMutation,
  useCreateRoleMutation,
  IPermissionDefinition,
  IPermissionCategory,
  RoleKind,
} from "@/lib/features/services/membership.api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Shield, Globe, MapPin, ChevronRight, Search } from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function RolePermissionsManager({ organizationId }: { organizationId: string }) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleKind, setNewRoleKind] = useState<RoleKind>(RoleKind.GLOBAL);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | RoleKind>("all");

  // Queries
  const { data: roles, isLoading: rolesLoading } = useGetOrgRolesQuery(organizationId);
  const { data: groupedPermissions } = useGetPermissionDefinitionsQuery();
  const { data: roleDetails, isFetching: roleFetching } = useGetRoleDetailsQuery(
    { organizationId, roleId: selectedRoleId! },
    { skip: !selectedRoleId }
  );

  // Mutations
  const [updateRole, { isLoading: isSaving }] = useUpdateRoleMutation();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();

  // Search by name + filter by scope. Counts feed the filter chips below.
  const counts = useMemo(
    () => ({
      all: roles?.length ?? 0,
      [RoleKind.GLOBAL]: roles?.filter((r) => r.kind === RoleKind.GLOBAL).length ?? 0,
      [RoleKind.LOCAL]: roles?.filter((r) => r.kind === RoleKind.LOCAL).length ?? 0,
    }),
    [roles],
  );

  const visibleRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (roles ?? []).filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roles, search, kindFilter]);

  // Sync permissions when editing a role
  useEffect(() => {
    if (roleDetails?.permissions) {
      setPermissionIds(roleDetails.permissions.map((p) => p.permissionDefinitionId));
    }
  }, [roleDetails]);

  // Handlers
  const togglePermission = (id: string) => {
    setPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCategory = (permsInGroup: IPermissionDefinition[]) => {
    const groupIds = permsInGroup.map((p) => p.id);
    const allSelected = groupIds.every((id) => permissionIds.includes(id));

    if (allSelected) {
      setPermissionIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setPermissionIds((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  // A role's kind constrains its permission scope, so switching kind invalidates
  // any already-picked permissions — clear them to keep the selection valid.
  const changeNewRoleKind = (kind: RoleKind) => {
    setNewRoleKind(kind);
    setPermissionIds([]);
  };

  // Open the create dialog from a clean slate, regardless of any role currently
  // being edited; restore the edited role's permissions when it closes.
  const openCreateDialog = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (open) {
      setNewRoleName("");
      setNewRoleKind(RoleKind.GLOBAL);
      setPermissionIds([]);
    } else if (roleDetails?.permissions) {
      setPermissionIds(roleDetails.permissions.map((p) => p.permissionDefinitionId));
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedRoleId) return;
    try {
      await updateRole({
        organizationId,
        roleId: selectedRoleId,
        body: { permissionIds },
      }).unwrap();
      toast.success("Permissions updated");
    } catch (e) {
      toast.error("Failed to update permissions");
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName) return toast.error("Role name is required");
    try {
      await createRole({
        organizationId,
        body: { name: newRoleName, kind: newRoleKind, permissionIds },
      }).unwrap();
      toast.success("Role created");
      setIsCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleKind(RoleKind.GLOBAL);
      setPermissionIds([]);
    } catch (e) {
      toast.error("Failed to create role");
    }
  };

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading roles…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Roles &amp; permissions</h2>
          <p className="text-sm text-muted-foreground">
            Define roles and control what members holding them can do.
          </p>
        </div>
        <Button onClick={() => openCreateDialog(true)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> New role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Role list */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {!roles?.length ? (
            <div className="rounded-lg border border-primary/40 dark:border-primary/20 p-8 text-center">
              <Shield className="h-7 w-7 mx-auto mb-3 text-muted-foreground/60" />
              <p className="font-medium">No roles yet</p>
              <p className="text-sm text-muted-foreground">Create your first role to get started.</p>
            </div>
          ) : (
            <>
              {/* Search + scope filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles"
                    className="pl-9"
                  />
                </div>
                <div className="inline-flex w-full rounded-lg border border-primary/40 dark:border-primary/20 p-0.5 text-sm">
                  <RoleFilterTab active={kindFilter === "all"} onClick={() => setKindFilter("all")} label="All" count={counts.all} />
                  <RoleFilterTab active={kindFilter === RoleKind.GLOBAL} onClick={() => setKindFilter(RoleKind.GLOBAL)} label="Org" count={counts[RoleKind.GLOBAL]} />
                  <RoleFilterTab active={kindFilter === RoleKind.LOCAL} onClick={() => setKindFilter(RoleKind.LOCAL)} label="Local" count={counts[RoleKind.LOCAL]} />
                </div>
              </div>

              {visibleRoles.length === 0 ? (
                <div className="rounded-lg border border-primary/40 dark:border-primary/20 p-8 text-center">
                  <Search className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">No roles match your filters.</p>
                </div>
              ) : (
            <div className="rounded-lg border border-primary/40 dark:border-primary/20 divide-y divide-primary/40 dark:divide-primary/20 overflow-hidden">
              {visibleRoles.map((role) => {
                const active = selectedRoleId === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 p-3 transition-colors",
                      active ? "bg-primary/8 dark:bg-primary/10" : "hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Shield className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium truncate">{role.name}</span>
                        <RoleKindBadge kind={role.kind} />
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {role._count?.memberships ?? 0}{" "}
                        {role._count?.memberships === 1 ? "member" : "members"}
                      </span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })}
            </div>
              )}
            </>
          )}
        </div>

        {/* Permission editor */}
        <div className="lg:col-span-8 xl:col-span-9">
          {!selectedRoleId ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 dark:border-primary/20 p-8 text-center">
              <Shield className="h-8 w-8 mb-3 text-muted-foreground/50" />
              <p className="font-medium">Select a role to edit</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a role from the list to review and adjust its permissions.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/40 dark:border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/40 dark:border-primary/20 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight truncate">
                      {roleDetails?.name ?? "…"}
                    </h3>
                    {roleDetails?.kind && <RoleKindBadge kind={roleDetails.kind} />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {permissionIds.length} permission{permissionIds.length === 1 ? "" : "s"} granted
                  </p>
                </div>
                <Button onClick={handleSaveUpdate} disabled={isSaving || roleFetching} className="shrink-0">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>

              <div className="p-4">
                {roleFetching ? (
                  <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading permissions…
                  </div>
                ) : (
                  <PermissionMatrix
                    groupedPermissions={groupedPermissions}
                    permissionIds={permissionIds}
                    togglePermission={togglePermission}
                    toggleCategory={toggleCategory}
                    scope={roleDetails?.kind}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create role dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={openCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>Name the role, choose its scope, and pick its permissions.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Sales Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scope</label>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-primary/40 dark:border-primary/20 p-1">
                  {[
                    { kind: RoleKind.GLOBAL, label: "Organization", icon: Globe, hint: "Applies across the whole organization" },
                    { kind: RoleKind.LOCAL, label: "Location", icon: MapPin, hint: "Assigned to a branch or warehouse" },
                  ].map((opt) => (
                    <button
                      key={opt.kind}
                      type="button"
                      onClick={() => changeNewRoleKind(opt.kind)}
                      title={opt.hint}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        newRoleKind === opt.kind
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Permissions</h4>
              <PermissionMatrix
                groupedPermissions={groupedPermissions}
                permissionIds={permissionIds}
                togglePermission={togglePermission}
                toggleCategory={toggleCategory}
                scope={newRoleKind}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => openCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Raw FeatureCategory enum values are not always self-explanatory in the UI
// (e.g. the org-wide ADMINISTRATION_ACCESS permission lives under USERS). Map
// each category to a friendlier heading, and float the most privileged ones up.
const CATEGORY_LABELS: Record<string, string> = {
  USERS: "Administration",
};

const CATEGORY_ORDER = ["USERS"];

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function categoryRank(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

/**
 * Grouped, scope-filtered permission picker shared by the editor and the
 * create dialog.
 */
function PermissionMatrix({
  groupedPermissions,
  permissionIds,
  togglePermission,
  toggleCategory,
  scope,
}: {
  groupedPermissions?: IPermissionCategory[],
  permissionIds: string[],
  togglePermission: (id: string) => void,
  toggleCategory: (perms: IPermissionDefinition[]) => void,
  scope?: RoleKind,
}) {
  // A role only ever holds permissions matching its kind, so when a scope is set
  // show just those permissions (RoleKind and PermissionScope share string values).
  const groups = (groupedPermissions ?? [])
    .map((group) => ({
      ...group,
      permissions: scope
        ? group.permissions.filter((p) => (p.scope as string) === (scope as string))
        : group.permissions,
    }))
    .filter((group) => group.permissions.length > 0)
    // Surface the most privileged categories (e.g. Administration) first.
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 text-sm text-muted-foreground rounded-lg border border-primary/40 dark:border-primary/20 bg-muted/40 p-3 leading-relaxed">
        {scope === RoleKind.LOCAL ? (
          <>
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Per-location</span> permissions take effect
              wherever this role is assigned. Grant it to a member on a specific{" "}
              <span className="font-medium text-foreground">branch or warehouse</span> from the{" "}
              <span className="font-medium text-foreground">Members</span> tab.
            </span>
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Org-wide</span> permissions apply across the
              entire organization for anyone holding this role.
            </span>
          </>
        )}
      </div>

      {groups.map((group) => {
        const isAllInGroupSelected = group.permissions.every((p) => permissionIds.includes(p.id));
        const selectedCount = group.permissions.filter((p) => permissionIds.includes(p.id)).length;

        return (
          <div key={group.category} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold tracking-tight">{categoryLabel(group.category)}</h4>
                <Badge variant="secondary" className="text-xs font-normal">
                  {selectedCount}/{group.permissions.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategory(group.permissions)}
                className="h-7 text-xs text-muted-foreground"
              >
                {isAllInGroupSelected ? "Clear all" : "Select all"}
              </Button>
            </div>

            <div className="rounded-lg border border-primary/40 dark:border-primary/20 divide-y divide-primary/40 dark:divide-primary/20 overflow-hidden">
              {group.permissions.map((p: IPermissionDefinition) => {
                const checked = permissionIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    htmlFor={p.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer transition-colors",
                      checked ? "bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      id={p.id}
                      checked={checked}
                      onCheckedChange={() => togglePermission(p.id)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5 leading-tight">
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.description && (
                        <span className="text-sm text-muted-foreground">{p.description}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** One segment of the role scope filter, with a live count. */
function RoleFilterTab({
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
        "flex-1 rounded-md px-2 py-1.5 transition-colors",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label} <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

/** Small badge labelling a role as org-wide (GLOBAL) or per-location (LOCAL). */
function RoleKindBadge({ kind }: { kind: RoleKind }) {
  return kind === RoleKind.LOCAL ? (
    <Badge variant="outline" className="gap-1 text-[10px] uppercase tracking-wider">
      <MapPin className="h-2.5 w-2.5" /> Per-location
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
      <Globe className="h-2.5 w-2.5" /> Org-wide
    </Badge>
  );
}
