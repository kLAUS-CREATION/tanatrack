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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterX, Boxes } from "lucide-react";
import { TableSkeleton } from "@/components/dashboard/shared/table-skeleton";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { FilterToolbar, type ActiveChip } from "../shared/filter-toolbar";
import { IStockLevel } from "@/lib/features/services/inventory.api";

const ALL = "__all__";
const POOL = "__pool__";

type StockStatus = typeof ALL | "in" | "low" | "out";

interface StockFilters {
  search: string;
  location: string; // ALL | POOL | `branch:<id>` | `warehouse:<id>`
  status: StockStatus;
}

const EMPTY_FILTERS: StockFilters = {
  search: "",
  location: ALL,
  status: ALL,
};

const STATUS_LABELS: Record<Exclude<StockStatus, typeof ALL>, string> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

function locationName(s: IStockLevel) {
  if (s.branch?.name) return s.branch.name;
  if (s.warehouse?.name) return s.warehouse.name;
  return "Unallocated (Receiving)";
}

function locationKey(s: IStockLevel) {
  if (s.branchId) return `branch:${s.branchId}`;
  if (s.warehouseId) return `warehouse:${s.warehouseId}`;
  return POOL;
}

function stockStatus(s: IStockLevel): Exclude<StockStatus, typeof ALL> {
  if (s.quantity <= 0) return "out";
  if (s.reorderPoint != null && s.quantity <= s.reorderPoint) return "low";
  return "in";
}

export function StockLevelsTab({
  stock,
  isLoading,
}: {
  stock: IStockLevel[];
  isLoading: boolean;
}) {
  const [filters, setFilters] = useState<StockFilters>(EMPTY_FILTERS);
  const set = (patch: Partial<StockFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  // Distinct locations present in the data (so the picker only lists real ones).
  const locationOptions = useMemo(() => {
    const seen = new Map<string, string>();
    let hasPool = false;
    for (const s of stock) {
      const key = locationKey(s);
      if (key === POOL) hasPool = true;
      else if (!seen.has(key)) seen.set(key, locationName(s));
    }
    return { entries: [...seen.entries()], hasPool };
  }, [stock]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return stock.filter((s) => {
      if (filters.location !== ALL && locationKey(s) !== filters.location)
        return false;
      if (filters.status !== ALL && stockStatus(s) !== filters.status)
        return false;
      if (q) {
        const haystack = [
          s.variant?.product?.name,
          s.variant?.name,
          s.variant?.sku,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [stock, filters]);

  // Display name for the currently-selected location (for the chip label).
  const selectedLocationName =
    filters.location === POOL
      ? "Unallocated (Receiving)"
      : locationOptions.entries.find(([key]) => key === filters.location)?.[1];

  const chips: ActiveChip[] = [];
  if (filters.location !== ALL)
    chips.push({
      key: "location",
      label: selectedLocationName ?? "Location",
      onRemove: () => set({ location: ALL }),
    });
  if (filters.status !== ALL)
    chips.push({
      key: "status",
      label: STATUS_LABELS[filters.status as Exclude<StockStatus, typeof ALL>],
      onRemove: () => set({ status: ALL }),
    });

  if (isLoading) return <TableSkeleton cols={4} />;

  if (stock.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title="No stock yet"
        description="Record a purchase to bring stock into the receiving pool, then allocate it to a location."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FilterToolbar
        search={filters.search}
        onSearchChange={(v) => set({ search: v })}
        searchPlaceholder="Search by product, variant or SKU…"
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
        resultCount={filtered.length}
        totalCount={stock.length}
      >
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
              {locationOptions.hasPool && (
                <SelectItem value={POOL}>Unallocated (Receiving)</SelectItem>
              )}
              {locationOptions.entries.map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Stock status</Label>
          <Select
            value={filters.status}
            onValueChange={(v) => set({ status: v as StockStatus })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const status = stockStatus(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.variant?.product?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {s.variant?.name}{" "}
                      <span className="text-xs text-muted-foreground font-mono">
                        {s.variant?.sku}
                      </span>
                    </TableCell>
                    <TableCell>{locationName(s)}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={status === "in" ? "secondary" : "destructive"}
                      >
                        {s.quantity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
