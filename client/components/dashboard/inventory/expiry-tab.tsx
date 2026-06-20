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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarClock, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { IStockBatch } from "@/lib/features/services/inventory.api";
import { WriteOffDialog, type WriteOffTarget } from "./write-off-dialog";

const DAY_MS = 24 * 60 * 60 * 1000;
// Batches expiring within this window are flagged "Expiring soon".
const SOON_DAYS = 7;

function locationName(b: IStockBatch) {
  if (b.branch?.name) return b.branch.name;
  if (b.warehouse?.name) return b.warehouse.name;
  return "Receiving pool";
}

function locationKey(b: IStockBatch) {
  if (b.branchId) return `branch:${b.branchId}`;
  if (b.warehouseId) return `warehouse:${b.warehouseId}`;
  return "pool";
}

function variantLabel(b: IStockBatch) {
  const product = b.variant?.product?.name ?? "Item";
  const variant = b.variant?.name ?? "";
  return variant ? `${product} — ${variant}` : product;
}

type ExpiryStatus = "expired" | "soon" | "ok";

function expiryStatus(expiryDate: string, now: number): ExpiryStatus {
  const diff = new Date(expiryDate).getTime() - now;
  if (diff <= 0) return "expired";
  if (diff <= SOON_DAYS * DAY_MS) return "soon";
  return "ok";
}

const STATUS_LABELS: Record<ExpiryStatus, string> = {
  expired: "Expired",
  soon: "Expiring soon",
  ok: "In date",
};

const STATUS_STYLES: Record<ExpiryStatus, string> = {
  expired: "border-red-500/30 bg-red-500/10 text-red-600",
  soon: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
};

export function ExpiryTab({
  batches,
  orgId,
  canManageStock,
  needsApproval,
}: {
  batches: IStockBatch[];
  orgId: string;
  canManageStock: boolean;
  needsApproval: boolean;
}) {
  // Stable "now" for one render pass so every row is classified consistently.
  const now = useMemo(() => Date.now(), [batches]);

  const [target, setTarget] = useState<WriteOffTarget | null>(null);

  // Total expired quantity per variant+location — the write-off removes them
  // all at once, so the dialog shows the aggregate, not a single batch.
  const expiredByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of batches) {
      if (expiryStatus(b.expiryDate, now) !== "expired") continue;
      const key = `${b.variantId}|${locationKey(b)}`;
      map.set(key, (map.get(key) ?? 0) + b.quantity);
    }
    return map;
  }, [batches, now]);

  const openWriteOff = (b: IStockBatch) => {
    setTarget({
      variantId: b.variantId,
      branchId: b.branchId ?? undefined,
      warehouseId: b.warehouseId ?? undefined,
      variantLabel: variantLabel(b),
      locationName: locationName(b),
      expiredQty: expiredByKey.get(`${b.variantId}|${locationKey(b)}`) ?? b.quantity,
    });
  };

  if (batches.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No perishable stock"
        description="Batches with expiry dates appear here once you receive stock for products marked as perishable."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Expiry date</TableHead>
            <TableHead>Status</TableHead>
            {canManageStock && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => {
            const status = expiryStatus(b.expiryDate, now);
            return (
              <TableRow key={b.id}>
                <TableCell className="font-medium">
                  {b.variant?.product?.name ?? "—"}
                  {b.variant?.name && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {b.variant.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>{locationName(b)}</TableCell>
                <TableCell className="text-right">{b.quantity}</TableCell>
                <TableCell>
                  {new Date(b.expiryDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full font-normal", STATUS_STYLES[status])}
                  >
                    {STATUS_LABELS[status]}
                  </Badge>
                </TableCell>
                {canManageStock && (
                  <TableCell className="text-right">
                    {status === "expired" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive h-8 gap-1.5"
                        onClick={() => openWriteOff(b)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Write off
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <WriteOffDialog
        isOpen={!!target}
        onClose={() => setTarget(null)}
        orgId={orgId}
        target={target}
        needsApproval={needsApproval}
      />
    </div>
  );
}
