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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Receipt,
  FilterX,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import { formatMoney, cn } from "@/lib/utils";
import {
  useGetSalesQuery,
  type ISale,
} from "@/lib/features/services/sales.api";
import { SaleDetailDialog } from "@/components/dashboard/sales/sale-detail-dialog";
import { PaymentBadge } from "@/components/dashboard/sales/payment-badge";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";

const ALL = "__all__";

type SortKey = "date" | "total";
type SortDir = "asc" | "desc";

export default function SalesPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data: sales, isLoading } = useGetSalesQuery(orgId);

  const [detail, setDetail] = useState<ISale | null>(null);

  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  // Snap back to the first page whenever the filtered result set changes.
  React.useEffect(() => {
    setPage(1);
  }, [search, seller, branch, from, to, sortKey, sortDir]);

  // Distinct seller / branch names present in the history, for the filter dropdowns.
  const sellerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const s of sales ?? []) if (s.seller?.name) names.add(s.seller.name);
    return [...names].sort();
  }, [sales]);

  const branchOptions = useMemo(() => {
    const names = new Set<string>();
    for (const s of sales ?? []) if (s.branch?.name) names.add(s.branch.name);
    return [...names].sort();
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 : null;

    const rows = (sales ?? []).filter((s) => {
      if (seller !== ALL && s.seller?.name !== seller) return false;
      if (branch !== ALL && s.branch?.name !== branch) return false;

      const ts = new Date(s.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts >= toTs) return false;

      if (q) {
        const hay = [
          s.customerName,
          s.customerPhone,
          s.branch?.name,
          s.seller?.name,
          ...(s.items ?? []).flatMap((i) => [i.variant?.name, i.variant?.sku]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const va =
        sortKey === "total" ? a.total : new Date(a.createdAt).getTime();
      const vb =
        sortKey === "total" ? b.total : new Date(b.createdAt).getTime();
      return (va - vb) * dir;
    });
    return rows;
  }, [sales, search, seller, branch, from, to, sortKey, sortDir]);

  // Summary stats for the currently-filtered set.
  const summary = useMemo(() => {
    let revenue = 0;
    let units = 0;
    for (const s of filtered) {
      revenue += s.total;
      units += (s.items ?? []).reduce((n, i) => n + i.quantity, 0);
    }
    return { revenue, units, count: filtered.length };
  }, [filtered]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const chips: ActiveChip[] = [];
  if (seller !== ALL)
    chips.push({ key: "seller", label: `By ${seller}`, onRemove: () => setSeller(ALL) });
  if (branch !== ALL)
    chips.push({ key: "branch", label: branch, onRemove: () => setBranch(ALL) });
  if (from)
    chips.push({ key: "from", label: `From ${from}`, onRemove: () => setFrom("") });
  if (to) chips.push({ key: "to", label: `To ${to}`, onRemove: () => setTo("") });

  const clearAll = () => {
    setSearch("");
    setSeller(ALL);
    setBranch(ALL);
    setFrom("");
    setTo("");
  };

  return (
    <>
      <PageShell
        title="Sales"
        subtitle="Review and filter transaction history."
        actionCount={0}
        loading={isLoading}
        empty={!sales || sales.length === 0}
        skeletonCols={7}
        emptyState={
          <EmptyState
            icon={Receipt}
            title="No sales yet"
            description="No sales have been recorded yet."
          />
        }
      >
        <div className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by customer, seller, branch or product…"
            chips={chips}
            onClearAll={clearAll}
            resultCount={filtered.length}
            totalCount={sales?.length ?? 0}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sold by</Label>
              <Select value={seller} onValueChange={setSeller}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All sellers</SelectItem>
                  {sellerOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
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
                  {branchOptions.map((name) => (
                    <SelectItem key={name} value={name}>
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
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
          </FilterToolbar>

          {/* Summary of the filtered set. */}
          <div className="grid grid-cols-3 divide-x divide-border rounded-sm border border-border bg-background2">
            <Stat label="Revenue" value={formatMoney(summary.revenue)} />
            <Stat label="Sales" value={String(summary.count)} />
            <Stat label="Items sold" value={String(summary.units)} />
          </div>

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
                    <SortHeader
                      label="Date"
                      active={sortKey === "date"}
                      dir={sortDir}
                      onClick={() => toggleSort("date")}
                    />
                    <TableHead>Branch</TableHead>
                    <TableHead>Sold by</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Items</TableHead>
                    <SortHeader
                      label="Total"
                      align="right"
                      active={sortKey === "total"}
                      dir={sortDir}
                      onClick={() => toggleSort("total")}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s) => (
                    <TableRow
                      key={s.id}
                      onClick={() => setDetail(s)}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{s.branch?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.seller?.name ?? "—"}
                      </TableCell>
                      <TableCell>{s.customerName ?? "Walk-in"}</TableCell>
                      <TableCell>
                        <PaymentBadge status={s.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.items?.length ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(s.total)}
                      </TableCell>
                    </TableRow>
                  ))}
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

      <SaleDetailDialog
        sale={detail}
        orgId={orgId}
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}
