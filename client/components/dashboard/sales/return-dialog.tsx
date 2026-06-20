"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import {
  type ISale,
  useCreateReturnMutation,
} from "@/lib/features/services/sales.api";

interface ReturnDialogProps {
  sale: ISale | null;
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Pick quantities to return per line (capped at the remaining, un-returned units). */
export function ReturnDialog({ sale, orgId, isOpen, onClose }: ReturnDialogProps) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [createReturn, { isLoading }] = useCreateReturnMutation();

  // Reset the per-line quantities whenever a different sale is opened.
  const saleId = sale?.id ?? null;
  React.useEffect(() => {
    setQty({});
    setReason("");
  }, [saleId]);

  const lines = useMemo(
    () =>
      (sale?.items ?? []).map((i) => ({
        ...i,
        remaining: i.quantity - i.returnedQuantity,
      })),
    [sale],
  );

  const refundTotal = lines.reduce(
    (sum, l) => sum + l.unitPrice * (qty[l.id] || 0),
    0,
  );
  const anySelected = Object.values(qty).some((q) => q > 0);

  const setLineQty = (id: string, value: number, max: number) =>
    setQty((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(value || 0, max)),
    }));

  const handleSubmit = async () => {
    if (!sale) return;
    const items = lines
      .filter((l) => (qty[l.id] || 0) > 0)
      .map((l) => ({ saleItemId: l.id, quantity: qty[l.id] }));
    if (items.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }
    try {
      await createReturn({
        orgId,
        saleId: sale.id,
        body: { reason: reason.trim() || undefined, items },
      }).unwrap();
      toast.success("Return processed — stock restocked");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to process return");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-muted-foreground" /> Return items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {lines.map((l) => (
            <div
              key={l.id}
              className="grid grid-cols-12 items-center gap-2 rounded-sm border border-border p-2"
            >
              <div className="col-span-6">
                <div className="font-medium">
                  {l.variant?.name ?? "Unknown item"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatMoney(l.unitPrice)} · {l.remaining} of {l.quantity}{" "}
                  returnable
                </div>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min={0}
                  max={l.remaining}
                  disabled={l.remaining === 0}
                  value={qty[l.id] || 0}
                  onChange={(e) =>
                    setLineQty(l.id, Number(e.target.value), l.remaining)
                  }
                />
              </div>
              <div className="col-span-3 text-right text-sm tabular-nums">
                {formatMoney(l.unitPrice * (qty[l.id] || 0))}
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Reason (optional)
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged on arrival"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Refund: </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(refundTotal)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !anySelected}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process return
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
