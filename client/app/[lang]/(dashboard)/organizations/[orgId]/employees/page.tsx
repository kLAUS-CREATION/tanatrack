"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar as AvatarRoot, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import {
  FilterToolbar,
  type ActiveChip,
} from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import { Contact, FilterX, Crown, Store, Warehouse, Globe } from "lucide-react";
import {
  useGetEmployeesQuery,
  OrganizationRole,
  type IMember,
} from "@/lib/features/services/membership.api";

const ALL = "__all__";
type LocationType = typeof ALL | "branch" | "warehouse" | "org";
const OWNER_ROLE = "__owner__";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Every role label held by a member (org type + global + local), for filtering. */
function memberRoleNames(m: IMember): string[] {
  const names: string[] = [];
  if (m.roleName) names.push(m.roleName);
  m.branches.forEach((b) => b.roleName && names.push(b.roleName));
  m.warehouses.forEach((w) => w.roleName && names.push(w.roleName));
  return names;
}

export default function EmployeesPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data: employees, isLoading } = useGetEmployeesQuery(orgId);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [warehouse, setWarehouse] = useState(ALL);
  const [locationType, setLocationType] = useState<LocationType>(ALL);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  React.useEffect(() => {
    setPage(1);
  }, [search, role, branch, warehouse, locationType]);

  // Distinct filter options derived from the directory.
  const { roleOptions, branchOptions, warehouseOptions, hasOwner } = useMemo(() => {
    const roles = new Set<string>();
    const branches = new Map<string, string>();
    const warehouses = new Map<string, string>();
    let owner = false;
    for (const m of employees ?? []) {
      if (m.roleType === OrganizationRole.OWNER) owner = true;
      memberRoleNames(m).forEach((r) => roles.add(r));
      m.branches.forEach(
        (b) => b.branchId && branches.set(b.branchId, b.branchName ?? "Branch"),
      );
      m.warehouses.forEach(
        (w) =>
          w.warehouseId &&
          warehouses.set(w.warehouseId, w.warehouseName ?? "Warehouse"),
      );
    }
    return {
      roleOptions: [...roles].sort(),
      branchOptions: [...branches].map(([id, name]) => ({ id, name })),
      warehouseOptions: [...warehouses].map(([id, name]) => ({ id, name })),
      hasOwner: owner,
    };
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (employees ?? []).filter((m) => {
      if (role === OWNER_ROLE && m.roleType !== OrganizationRole.OWNER)
        return false;
      if (role !== ALL && role !== OWNER_ROLE && !memberRoleNames(m).includes(role))
        return false;

      if (branch !== ALL && !m.branches.some((b) => b.branchId === branch))
        return false;
      if (
        warehouse !== ALL &&
        !m.warehouses.some((w) => w.warehouseId === warehouse)
      )
        return false;

      if (locationType === "branch" && m.branches.length === 0) return false;
      if (locationType === "warehouse" && m.warehouses.length === 0) return false;
      if (
        locationType === "org" &&
        (m.branches.length > 0 || m.warehouses.length > 0)
      )
        return false;

      if (q) {
        const hay = [m.user.name, m.user.email].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, role, branch, warehouse, locationType]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const chips: ActiveChip[] = [];
  if (role !== ALL)
    chips.push({
      key: "role",
      label: role === OWNER_ROLE ? "Owner" : role,
      onRemove: () => setRole(ALL),
    });
  if (branch !== ALL)
    chips.push({
      key: "branch",
      label: branchOptions.find((b) => b.id === branch)?.name ?? "Branch",
      onRemove: () => setBranch(ALL),
    });
  if (warehouse !== ALL)
    chips.push({
      key: "warehouse",
      label:
        warehouseOptions.find((w) => w.id === warehouse)?.name ?? "Warehouse",
      onRemove: () => setWarehouse(ALL),
    });
  if (locationType !== ALL)
    chips.push({
      key: "loc",
      label:
        locationType === "branch"
          ? "In a branch"
          : locationType === "warehouse"
            ? "In a warehouse"
            : "Organization-wide",
      onRemove: () => setLocationType(ALL),
    });

  const clearAll = () => {
    setSearch("");
    setRole(ALL);
    setBranch(ALL);
    setWarehouse(ALL);
    setLocationType(ALL);
  };

  return (
    <PageShell
      title="Employees"
      subtitle="Everyone in your organization and where they work."
      actionCount={0}
      loading={isLoading}
      empty={!employees || employees.length === 0}
      skeletonCols={4}
      emptyState={
        <EmptyState
          icon={Contact}
          title="No employees yet"
          description="Members you invite to the organization will appear here."
        />
      }
    >
      <div className="space-y-4">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email…"
          chips={chips}
          onClearAll={clearAll}
          resultCount={filtered.length}
          totalCount={employees?.length ?? 0}
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                {hasOwner && <SelectItem value={OWNER_ROLE}>Owner</SelectItem>}
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Branch</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Warehouse</Label>
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All warehouses</SelectItem>
                {warehouseOptions.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Assignment</Label>
            <Select
              value={locationType}
              onValueChange={(v) => setLocationType(v as LocationType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Anywhere</SelectItem>
                <SelectItem value="branch">Assigned to a branch</SelectItem>
                <SelectItem value="warehouse">Assigned to a warehouse</SelectItem>
                <SelectItem value="org">Organization-wide only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterToolbar>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-sm text-center">
            <FilterX className="h-8 w-8 mb-3 text-muted-foreground/60" />
            <p className="font-medium">No matches</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting or clearing your filters.
            </p>
          </div>
        ) : (
          <div className="rounded-sm border border-border bg-background2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Organization role</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Warehouses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((m) => {
                  const isOwner = m.roleType === OrganizationRole.OWNER;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AvatarRoot className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                              {initials(m.user.name)}
                            </AvatarFallback>
                          </AvatarRoot>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {m.user.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {m.user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isOwner ? (
                          <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                            <Crown className="h-3 w-3" /> Owner
                          </Badge>
                        ) : m.roleName ? (
                          <Badge variant="secondary">{m.roleName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Member</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.branches.map((b) => (
                              <Badge
                                key={b.branchMemberId ?? b.branchId}
                                variant="outline"
                                className="gap-1 font-normal"
                              >
                                <Store className="h-3 w-3 text-muted-foreground" />
                                {b.branchName}
                                {b.roleName && (
                                  <span className="text-muted-foreground">
                                    · {b.roleName}
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : m.warehouses.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" /> Organization-wide
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.warehouses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.warehouses.map((w) => (
                              <Badge
                                key={w.warehouseMemberId ?? w.warehouseId}
                                variant="outline"
                                className="gap-1 font-normal"
                              >
                                <Warehouse className="h-3 w-3 text-muted-foreground" />
                                {w.warehouseName}
                                {w.roleName && (
                                  <span className="text-muted-foreground">
                                    · {w.roleName}
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
