"use client";

import React, { useState, useEffect } from "react";
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
import {
  Loader2, Save, Plus, Shield, ShieldCheck,
  ChevronRight, Lock,
  CheckSquare, Square
} from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RolePermissionsManager({ organizationId }: { organizationId: string }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleKind, setNewRoleKind] = useState<RoleKind>(RoleKind.GLOBAL);

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

  const handleSaveUpdate = async () => {
    if (!selectedRoleId) return;
    try {
      await updateRole({
        organizationId,
        roleId: selectedRoleId,
        body: { permissionIds },
      }).unwrap();
      toast.success("Security configuration updated");
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
      toast.success("New role established");
      setIsCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleKind(RoleKind.GLOBAL);
      setPermissionIds([]);
    } catch (e) {
      toast.error("Failed to create role");
    }
  };

  if (rolesLoading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading Security Modules...</p>
    </div>
  );

  return (
    <div className="w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Access Management</h1>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"}>
                New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">New Role</DialogTitle>
              <DialogDescription>Define a new role and assign its baseline permissions.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 w-full">
              <div className="w-full flex flex-col gap-3 items-start">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Identity</label>
                  <Input
                    placeholder="e.g. Sales Manager"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="">
                  <label className="text-sm font-medium">Role Scope</label>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/40 p-1">
                    {[
                      { kind: RoleKind.GLOBAL, label: "organization wide", hint: "Applies across the whole organization" },
                      { kind: RoleKind.LOCAL, label: "Per-location", hint: "Assigned to a branch or warehouse" },
                    ].map((opt) => (
                      <button
                        key={opt.kind}
                        type="button"
                        onClick={() => changeNewRoleKind(opt.kind)}
                        title={opt.hint}
                        className={`flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-all ${
                          newRoleKind === opt.kind
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-background text-muted-foreground"
                        }`}
                      >
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Assign Permissions</h3>
                <PermissionMatrix
                  groupedPermissions={groupedPermissions}
                  permissionIds={permissionIds}
                  togglePermission={togglePermission}
                  toggleCategory={toggleCategory}
                  scope={newRoleKind}
                />
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 py-3 bg-background">
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRole} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-100 grid-cols-2 mb-8 bg-muted/50 p-1">
          <TabsTrigger value="overview">All Roles</TabsTrigger>
          <TabsTrigger value="designer">Manager Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
            {roles?.map((role) => (
              <div
                key={role.id}
                className="group relative border border-primary/30 dark:border-primary/10 rounded-lg p-3 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setActiveTab("designer");
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary transition-colors">
                    <Shield className="h-6 w-6" />
                  </div>
                  <p className="font-mono">
                    {role._count?.memberships || 0} Employees
                  </p>
                </div>
                <h3 className="text-xl mb-1 flex items-center gap-2">
                  {role.name}
                  <RoleKindBadge kind={role.kind} />
                </h3>

                <div className="flex items-center text-foreground font-medium text-sm">
                  Configure Permissions <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="designer">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar: Role Selector */}
            <div className="lg:col-span-3 space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase px-2 mb-4 tracking-widest">Select Context</div>
              {roles?.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left px-4 py-4 rounded-xs border transition-all duration-200 flex items-center justify-between ${
                    selectedRoleId === role.id
                      ? "bg-primary/8 dark:bg-primary/4 border-primary/40 dark:border-primary/30"
                      : "border-primary/20 dark:border-primary/10"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{role.name}</div>
                    <div className={`text-xs ${selectedRoleId === role.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {role._count?.memberships} active users
                    </div>
                  </div>
                  {selectedRoleId === role.id && <ShieldCheck className="h-5 w-5" />}
                </button>
              ))}
            </div>

            {/* Right Side: Matrix */}
            <div className="lg:col-span-9 border border-primary/30 rounded-lg p-4">
              {!selectedRoleId ? (
                <div className="h-96 flex flex-col items-center justify-center text-center">
                  <div className="p-6 bg-background rounded-full mb-4 shadow-inner">
                    <Lock className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-xl font-semibold">No Role Selected</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">Select a role from the sidebar to modify its security clearance level.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-3xl font-bold tracking-tight">{roleDetails?.name}</h2>
                        {roleDetails?.kind && <RoleKindBadge kind={roleDetails.kind} />}
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active Configuration</Badge>
                      </div>
                      <p className="text-muted-foreground">Modifying permissions for the {roleDetails?.name?.toLowerCase()} security group.</p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleSaveUpdate}
                      disabled={isSaving || roleFetching}
                    >
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
                      Sync Changes
                    </Button>
                  </div>

                  {roleFetching ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="animate-spin h-10 w-10 text-primary" />
                      <p className="text-muted-foreground font-medium">Decrypting Permissions...</p>
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
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
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
 * Sub-component for the Permission Grid to keep the main logic clean
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
    <div className="space-y-10">
      <div className="text-sm text-muted-foreground bg-muted/40 border rounded-lg p-3 leading-relaxed">
        {scope === RoleKind.LOCAL ? (
          <>
            <span className="font-semibold text-foreground">Per-location</span> permissions take effect
            wherever this role is assigned. Grant the role to a member on a specific{" "}
            <span className="font-semibold text-foreground">branch or warehouse</span> from the{" "}
            <span className="font-semibold text-foreground">Members</span> tab to scope their access there.
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">Org-wide</span> permissions apply across the
            entire organization for anyone holding this role.
          </>
        )}
      </div>
      {groups.map((group) => {
        const isAllInGroupSelected = group.permissions.every((p) => permissionIds.includes(p.id));
        const isSomeInGroupSelected = group.permissions.some((p) => permissionIds.includes(p.id)) && !isAllInGroupSelected;

        return (
          <div key={group.category} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4 bg-muted/40 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="font-bold text-lg tracking-tight uppercase">{categoryLabel(group.category)}</h3>
                <Badge variant="outline" className="bg-background">{group.permissions.length} permissions</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategory(group.permissions)}
                className={`flex items-center gap-2 hover:bg-background ${isAllInGroupSelected ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {isAllInGroupSelected ? <CheckSquare className="h-4 w-4" /> : isSomeInGroupSelected ? <Square className="h-4 w-4 fill-primary/20" /> : <Square className="h-4 w-4" />}
                <span className="text-xs font-bold tracking-widest uppercase">
                  {isAllInGroupSelected ? "Deselect All" : "Select All Category"}
                </span>
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {group.permissions.map((p: IPermissionDefinition) => (
                <div
                  key={p.id}
                  onClick={() => togglePermission(p.id)}
                  className={`flex items-start space-x-4 p-3 rounded-xs border border-primary/10 transition-all duration-200 cursor-pointer group ${
                    permissionIds.includes(p.id)
                      ? "bg-primary/3 border-primary/30"
                      : "bg-background hover:border-muted-foreground/30 hover:bg-muted/10"
                  }`}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      id={p.id}
                      checked={permissionIds.includes(p.id)}
                      onCheckedChange={() => togglePermission(p.id)}
                      className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={p.id}
                      className="text-[15px] font-bold cursor-pointer transition-colors flex items-center gap-2"
                    >
                      {p.name}
                    </label>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Small badge labelling a role as org-wide (GLOBAL) or per-location (LOCAL). */
function RoleKindBadge({ kind }: { kind: RoleKind }) {
  return kind === RoleKind.LOCAL ? (
    <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-600 border-blue-500/20">
      Per-location
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground">
      Org-wide
    </Badge>
  );
}
