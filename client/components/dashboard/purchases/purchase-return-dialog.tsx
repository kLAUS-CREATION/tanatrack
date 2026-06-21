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
  type IPurchase,
  useCreatePurchaseReturnMutation,
} from "@/lib/features/services/purchase.api";

interface PurchaseReturnDialogProps {
  purchase: IPurchase | null;
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Pick quantities to return to the supplier per line (capped at the remaining,
 * un-returned units; the server further caps by what's still in the pool). */
export function PurchaseReturnDialog({
  purchase,
  orgId,
  isOpen,
  onClose,
}: PurchaseReturnDialogProps) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [createReturn, { isLoading }] = useCreatePurchaseReturnMutation();

  // Reset the per-line quantities whenever a different purchase is opened.
  const purchaseId = purchase?.id ?? null;
  React.useEffect(() => {
    setQty({});
    setReason("");
  }, [purchaseId]);

  const lines = useMemo(
    () =>
      (purchase?.items ?? []).map((i) => ({
        ...i,
        remaining: i.quantity - i.returnedQuantity,
      })),
    [purchase],
  );

  const returnTotal = lines.reduce(
    (sum, l) => sum + l.unitCost * (qty[l.id] || 0),
    0,
  );
  const anySelected = Object.values(qty).some((q) => q > 0);

  const setLineQty = (id: string, value: number, max: number) =>
    setQty((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(value || 0, max)),
    }));

  const handleSubmit = async () => {
    if (!purchase) return;
    const items = lines
      .filter((l) => (qty[l.id] || 0) > 0)
      .map((l) => ({ purchaseItemId: l.id, quantity: qty[l.id] }));
    if (items.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }
    try {
      await createReturn({
        orgId,
        purchaseId: purchase.id,
        body: { reason: reason.trim() || undefined, items },
      }).unwrap();
      toast.success("Return processed — stock removed from the receiving pool");
      onClose();
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Failed to process return");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-muted-foreground" /> Return to supplier
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
                  {formatMoney(l.unitCost)} · {l.remaining} of {l.quantity}{" "}
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
                {formatMoney(l.unitCost * (qty[l.id] || 0))}
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
              placeholder="e.g. Wrong item received"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Return value: </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(returnTotal)}
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
