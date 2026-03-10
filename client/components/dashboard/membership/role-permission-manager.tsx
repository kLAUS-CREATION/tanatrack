"use client";

import React, { useState, useEffect } from "react";
import {
  useGetPermissionDefinitionsQuery,
  useGetOrgRolesQuery,
  useGetRoleDetailsQuery,
  useUpdateRoleMutation
} from "@/lib/features/services/membership.api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Fingerprint } from "lucide-react";
import { toast } from "sonner";

export function RolePermissionsManager({ organizationId }: { organizationId: string }) {
  const { data: roles, isLoading: rolesLoading } = useGetOrgRolesQuery(organizationId);
  const { data: definitions } = useGetPermissionDefinitionsQuery();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  console.log("these are permissions: ", definitions);

  const { data: roleDetails, isFetching: roleFetching } = useGetRoleDetailsQuery(
    { organizationId, roleId: selectedRoleId! },
    { skip: !selectedRoleId }
  );

  const [updateRole, { isLoading: isSaving }] = useUpdateRoleMutation();
  const [permissionIds, setPermissionIds] = useState<string[]>([]);

  // Update local checkboxes when role details load
  useEffect(() => {
    if (roleDetails?.permissions) {
      setPermissionIds(roleDetails.permissions.map(p => p.permissionDefinitionId));
    }
  }, [roleDetails]);

  const togglePermission = (id: string) => {
    setPermissionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      await updateRole({
        organizationId,
        roleId: selectedRoleId,
        body: { permissionIds }
      }).unwrap();
      toast.success("Security permissions updated successfully");
    } catch (e) {
      toast.error("Failed to update role permissions");
    }
  };

  // Grouping logic
  const grouped = definitions?.reduce((acc, def) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, typeof definitions>);

  if (rolesLoading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Role Sidebar */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase px-2">Select Role</h3>
        {roles?.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRoleId(role.id)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              selectedRoleId === role.id
              ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
              : "bg-card hover:border-primary/50"
            }`}
          >
            <div className="font-bold">{role.name}</div>
            <div className="text-xs opacity-70">{role._count?.memberships} Members assigned</div>
          </div>
        ))}
      </div>

      {/* Permission Grid */}
      <div className="lg:col-span-3">
        {!selectedRoleId ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
            <Fingerprint className="h-10 w-10 mb-2 opacity-20" />
            <p>Select a role on the left to manage its security clearance.</p>
          </div>
        ) : (
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Permissions Matrix</CardTitle>
                <CardDescription>Grant specific access levels for the {roleDetails?.name} role.</CardDescription>
              </div>
              <Button onClick={handleSave} disabled={isSaving || roleFetching}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardHeader>

            <CardContent className="px-0 space-y-8">
              {roleFetching ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>
              ) : (
                Object.entries(grouped || {}).map(([category, perms]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{category}</Badge>
                      <div className="h-1 flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map((p) => (
                        <div key={p.id} className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                          <Checkbox
                            id={p.id}
                            checked={permissionIds.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label htmlFor={p.id} className="text-sm font-semibold leading-none cursor-pointer">
                              {p.name}
                            </label>
                            <p className="text-xs text-muted-foreground">{p.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
