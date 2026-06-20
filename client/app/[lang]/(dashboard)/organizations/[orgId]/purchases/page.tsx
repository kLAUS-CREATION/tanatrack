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
import { Button } from "@/components/ui/button";
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
import { FilterToolbar, type ActiveChip } from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import { ShoppingCart, Plus, Clock, FilterX } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import { useGetPurchasesQuery } from "@/lib/features/services/purchase.api";
import { useGetSuppliersQuery } from "@/lib/features/services/supplier.api";
import type { IPurchase } from "@/lib/features/services/purchase.api";
import { NewPurchaseDialog } from "@/components/dashboard/purchases/new-purchase-dialog";
import { PurchaseDetailDialog } from "@/components/dashboard/purchases/purchase-detail-dialog";

const PURCHASE_MANAGE = "PURCHASE_MANAGE";

const ALL = "__all__";

export default function PurchasesPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  // PURCHASE_MANAGE holders and admins can record purchases; admins apply
  // instantly, makers' purchases go to the approval queue (no stock until then).
  const canPurchase =
    isOwner || canAdminister || permissions.includes(PURCHASE_MANAGE);
  const needsApproval = canPurchase && !canAdminister;

  const { data: purchases, isLoading } = useGetPurchasesQuery(orgId);
  const { data: products } = useGetProductsQuery(orgId);
  const { data: suppliers } = useGetSuppliersQuery(orgId);

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<IPurchase | null>(null);

  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  React.useEffect(() => {
    setPage(1);
  }, [search, supplier, from, to]);

  // Distinct supplier names present in the purchase history (free-text and
  // linked suppliers both surface by display name).
  const supplierOptions = useMemo(() => {
    const names = new Set<string>();
    for (const p of purchases ?? []) {
      const name = p.supplier?.name ?? p.supplierName;
      if (name) names.add(name);
    }
    return [...names].sort();
  }, [purchases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 : null;

    return (purchases ?? []).filter((p) => {
      const name = p.supplier?.name ?? p.supplierName ?? "";
      if (supplier !== ALL && name !== supplier) return false;

      const ts = new Date(p.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts >= toTs) return false;

      if (q) {
        const hay = [name, p.reference].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [purchases, search, supplier, from, to]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const chips: ActiveChip[] = [];
  if (supplier !== ALL)
    chips.push({ key: "supplier", label: supplier, onRemove: () => setSupplier(ALL) });
  if (from)
    chips.push({ key: "from", label: `From ${from}`, onRemove: () => setFrom("") });
  if (to) chips.push({ key: "to", label: `To ${to}`, onRemove: () => setTo("") });

  const clearAll = () => {
    setSearch("");
    setSupplier(ALL);
    setFrom("");
    setTo("");
  };

  return (
    <>
      <PageShell
        title="Purchases"
        subtitle="Record stock received from suppliers and review purchase history."
        actionCount={canPurchase ? 1 : 0}
        actions={
          canPurchase && (
            <Button onClick={() => setIsOpen(true)} className="gap-2 rounded-sm">
              <Plus className="h-4 w-4" /> New Purchase
            </Button>
          )
        }
        banner={
          /* Makers: heads-up that purchases route through approval before stock moves. */
          needsApproval && (
            <div className="mb-6 flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Purchases you record are submitted for approval by an
                administrator — stock is received only once approved.
              </span>
            </div>
          )
        }
        loading={isLoading}
        empty={!purchases || purchases.length === 0}
        skeletonCols={6}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="No purchases yet"
            description={
              canPurchase
                ? "Record your first purchase to bring stock in."
                : "No purchases have been recorded yet."
            }
          />
        }
      >
        <div className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by supplier or reference…"
            chips={chips}
            onClearAll={clearAll}
            resultCount={filtered.length}
            totalCount={purchases?.length ?? 0}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Supplier</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All suppliers</SelectItem>
                  {supplierOptions.map((name) => (
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
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Received into</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(p)}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.supplier?.name ?? p.supplierName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.branch?.name ?? p.warehouse?.name ?? "Receiving pool"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.items?.length ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(p.total)}
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

      <NewPurchaseDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        orgId={orgId}
        products={products ?? []}
        suppliers={suppliers ?? []}
        needsApproval={needsApproval}
      />

      <PurchaseDetailDialog
        purchase={selected}
        orgId={orgId}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        canManage={canPurchase}
      />
    </>
  );
}
