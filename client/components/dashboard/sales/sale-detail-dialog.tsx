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
import { Receipt, Undo2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { ISale } from "@/lib/features/services/sales.api";
import { useGetSellableBranchesQuery } from "@/lib/features/services/sales.api";
import { PaymentBadge } from "./payment-badge";
import { ReturnDialog } from "./return-dialog";

interface SaleDetailDialogProps {
  sale: ISale | null;
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile Money",
};

/** Read-only receipt for a single sale, reusing the row data already loaded by the list. */
export function SaleDetailDialog({
  sale,
  orgId,
  isOpen,
  onClose,
}: SaleDetailDialogProps) {
  const [returning, setReturning] = useState(false);

  // Returns are allowed for users who may sell at the sale's branch.
  const { data: sellableBranches } = useGetSellableBranchesQuery(orgId);
  const canReturnHere = !!sellableBranches?.some((b) => b.id === sale?.branchId);
  const hasReturnable = (sale?.items ?? []).some(
    (i) => i.quantity - i.returnedQuantity > 0,
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              Sale receipt
            </DialogTitle>
          </DialogHeader>

          {sale && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <Detail
                  label="Date"
                  value={new Date(sale.createdAt).toLocaleString()}
                />
                <Detail label="Branch" value={sale.branch?.name ?? "—"} />
                <Detail label="Sold by" value={sale.seller?.name ?? "—"} />
                <Detail
                  label="Customer"
                  value={sale.customerName ?? "Walk-in"}
                  sub={sale.customerPhone ?? undefined}
                />
                <Detail
                  label="Payment"
                  custom={<PaymentBadge status={sale.paymentStatus} />}
                  sub={
                    sale.paymentMethod
                      ? METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod
                      : undefined
                  }
                />
                {sale.paymentRef && (
                  <Detail label="Reference" value={sale.paymentRef} />
                )}
              </div>

              <div className="rounded-sm border border-border bg-background2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item) => (
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
                          {formatMoney(item.unitPrice)}
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
                <SummaryRow label="Subtotal" value={formatMoney(sale.subtotal)} muted />
                {sale.discount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`- ${formatMoney(sale.discount)}`}
                    muted
                  />
                )}
                {sale.tax > 0 && (
                  <SummaryRow label="VAT" value={formatMoney(sale.tax)} muted />
                )}
                <SummaryRow label="Total" value={formatMoney(sale.total)} bold />
                <SummaryRow
                  label="Paid"
                  value={formatMoney(sale.amountPaid)}
                  muted
                />
                {sale.refundedTotal > 0 && (
                  <SummaryRow
                    label="Refunded"
                    value={`- ${formatMoney(sale.refundedTotal)}`}
                    muted
                  />
                )}
              </div>

              {canReturnHere && hasReturnable && (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setReturning(true)}
                  >
                    <Undo2 className="h-4 w-4" /> Return items
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReturnDialog
        sale={sale}
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
  custom,
}: {
  label: string;
  value?: string;
  sub?: string;
  custom?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      {custom ?? <div className="font-medium">{value}</div>}
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
