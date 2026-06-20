"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterX, ArrowLeftRight } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { FilterToolbar, type ActiveChip } from "../shared/filter-toolbar";
import {
  IStockMovement,
  MovementType,
} from "@/lib/features/services/inventory.api";

const ALL = "__all__";

interface MovementFilters {
  search: string;
  type: string; // ALL | MovementType
  location: string; // ALL | `branch:<id>` | `warehouse:<id>`
  from: string;
  to: string;
}

const EMPTY_FILTERS: MovementFilters = {
  search: "",
  type: ALL,
  location: ALL,
  from: "",
  to: "",
};

const TYPE_LABELS: Record<MovementType, string> = {
  [MovementType.PURCHASE_IN]: "Purchase in",
  [MovementType.SALE_OUT]: "Sale out",
  [MovementType.SALE_RETURN]: "Sale return",
  [MovementType.PURCHASE_RETURN]: "Purchase return",
  [MovementType.TRANSFER]: "Transfer",
  [MovementType.ADJUSTMENT]: "Adjustment",
  [MovementType.EXPIRY_WRITE_OFF]: "Expiry write-off",
};

function movementLocation(m: IStockMovement) {
  const from = m.fromBranch?.name ?? m.fromWarehouse?.name;
  const to = m.toBranch?.name ?? m.toWarehouse?.name;
  if (from && to) return `${from} → ${to}`;
  if (to) return `→ ${to}`;
  if (from) return `${from} →`;
  return "—";
}

// Every location key a movement touches (either side), for the location filter.
function movementLocationKeys(m: IStockMovement): string[] {
  const keys: string[] = [];
  if (m.fromBranchId) keys.push(`branch:${m.fromBranchId}`);
  if (m.fromWarehouseId) keys.push(`warehouse:${m.fromWarehouseId}`);
  if (m.toBranchId) keys.push(`branch:${m.toBranchId}`);
  if (m.toWarehouseId) keys.push(`warehouse:${m.toWarehouseId}`);
  return keys;
}

export function MovementsTab({ movements }: { movements: IStockMovement[] }) {
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_FILTERS);
  const set = (patch: Partial<MovementFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  // Distinct locations referenced by any movement (either side).
  const locationOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of movements) {
      const sides: Array<[string | null | undefined, string | undefined]> = [
        [m.fromBranchId, m.fromBranch?.name],
        [m.toBranchId, m.toBranch?.name],
      ];
      for (const [id, name] of sides)
        if (id && name && !seen.has(`branch:${id}`))
          seen.set(`branch:${id}`, name);
      const wh: Array<[string | null | undefined, string | undefined]> = [
        [m.fromWarehouseId, m.fromWarehouse?.name],
        [m.toWarehouseId, m.toWarehouse?.name],
      ];
      for (const [id, name] of wh)
        if (id && name && !seen.has(`warehouse:${id}`))
          seen.set(`warehouse:${id}`, name);
    }
    return [...seen.entries()];
  }, [movements]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const fromTs = filters.from ? new Date(filters.from).getTime() : null;
    const toTs = filters.to
      ? new Date(filters.to).getTime() + 24 * 60 * 60 * 1000
      : null;

    return movements.filter((m) => {
      if (filters.type !== ALL && m.type !== filters.type) return false;
      if (
        filters.location !== ALL &&
        !movementLocationKeys(m).includes(filters.location)
      )
        return false;

      const ts = new Date(m.createdAt).getTime();
      if (fromTs != null && ts < fromTs) return false;
      if (toTs != null && ts >= toTs) return false;

      if (q) {
        const haystack = [m.variant?.product?.name, m.variant?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [movements, filters]);

  const locationNameByKey = new Map(locationOptions);

  const chips: ActiveChip[] = [];
  if (filters.type !== ALL)
    chips.push({
      key: "type",
      label: TYPE_LABELS[filters.type as MovementType],
      onRemove: () => set({ type: ALL }),
    });
  if (filters.location !== ALL)
    chips.push({
      key: "location",
      label: locationNameByKey.get(filters.location) ?? "Location",
      onRemove: () => set({ location: ALL }),
    });
  if (filters.from)
    chips.push({
      key: "from",
      label: `From ${filters.from}`,
      onRemove: () => set({ from: "" }),
    });
  if (filters.to)
    chips.push({
      key: "to",
      label: `To ${filters.to}`,
      onRemove: () => set({ to: "" }),
    });

  if (movements.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No movements yet"
        description="Stock changes will appear here as a comprehensive audit trail."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FilterToolbar
        search={filters.search}
        onSearchChange={(v) => set({ search: v })}
        searchPlaceholder="Search by product or variant…"
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
        resultCount={filtered.length}
        totalCount={movements.length}
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={filters.type} onValueChange={(v) => set({ type: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.values(MovementType).map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Select
            value={filters.location}
            onValueChange={(v) => set({ location: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locationOptions.map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => set({ from: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => set({ to: e.target.value })}
            />
          </div>
        </div>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-2xl text-center">
          <FilterX className="h-8 w-8 mb-3 text-muted-foreground/60" />
          <p className="font-medium">No matches</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting or clearing your filters.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {m.variant?.product?.name} — {m.variant?.name}
                  </TableCell>
                  <TableCell>{movementLocation(m)}</TableCell>
                  <TableCell className="text-right">{m.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
