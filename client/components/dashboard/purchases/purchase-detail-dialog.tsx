"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Undo2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { IPurchase } from "@/lib/features/services/purchase.api";
import { PurchaseReturnDialog } from "./purchase-return-dialog";

interface PurchaseDetailDialogProps {
  purchase: IPurchase | null;
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Whether the viewer may record returns to the supplier. */
  canManage: boolean;
}

/** Read-only summary for a single purchase, reusing the row data already loaded. */
export function PurchaseDetailDialog({
  purchase,
  orgId,
  isOpen,
  onClose,
  canManage,
}: PurchaseDetailDialogProps) {
  const [returning, setReturning] = useState(false);

  const hasReturnable = (purchase?.items ?? []).some(
    (i) => i.quantity - i.returnedQuantity > 0,
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              Purchase details
            </DialogTitle>
          </DialogHeader>

          {purchase && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <Detail
                  label="Date"
                  value={new Date(purchase.createdAt).toLocaleString()}
                />
                <Detail
                  label="Supplier"
                  value={purchase.supplier?.name ?? purchase.supplierName ?? "—"}
                />
                <Detail
                  label="Received into"
                  value={
                    purchase.branch?.name ??
                    purchase.warehouse?.name ??
                    "Receiving pool"
                  }
                />
                {purchase.reference && (
                  <Detail label="Reference" value={purchase.reference} />
                )}
              </div>

              <div className="rounded-sm border border-border bg-background2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit cost</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">
                            {item.variant?.name ?? "Unknown item"}
                          </div>
                          {item.variant?.sku && (
                            <div className="text-xs text-muted-foreground">
                              {item.variant.sku}
                            </div>
                          )}
                          {item.returnedQuantity > 0 && (
                            <div className="text-xs text-sky-600">
                              {item.returnedQuantity} returned
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatMoney(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                <SummaryRow
                  label="Total cost"
                  value={formatMoney(purchase.total)}
                  bold
                />
              </div>

              {canManage && hasReturnable && (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setReturning(true)}
                  >
                    <Undo2 className="h-4 w-4" /> Return to supplier
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PurchaseReturnDialog
        purchase={purchase}
        orgId={orgId}
        isOpen={returning}
        onClose={() => setReturning(false)}
      />
    </>
  );
}

function Detail({
  label,
  value,
  sub,
}: {
  label: string;
  value?: string;
  sub?: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={
        "flex w-56 justify-between " +
        (bold ? "text-base font-semibold" : muted ? "text-muted-foreground" : "")
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
