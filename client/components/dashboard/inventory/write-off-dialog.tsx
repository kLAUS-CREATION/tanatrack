"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useWriteOffExpiredMutation } from "@/lib/features/services/allocation.api";
import { isPendingChange } from "@/lib/features/services/change-request.api";

// What the Expiry tab hands to the dialog when "Write off" is clicked on an
// expired row. The quantity is a display snapshot — the server recomputes the
// exact expired total for this variant+location when the move is applied.
export interface WriteOffTarget {
  variantId: string;
  branchId?: string;
  warehouseId?: string;
  variantLabel: string;
  locationName: string;
  expiredQty: number;
}

interface WriteOffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  target: WriteOffTarget | null;
  /** When the actor isn't an approver, the write-off is queued for approval. */
  needsApproval?: boolean;
}

export function WriteOffDialog({
  isOpen,
  onClose,
  orgId,
  target,
  needsApproval,
}: WriteOffDialogProps) {
  const [reason, setReason] = useState("");
  const [writeOff, { isLoading }] = useWriteOffExpiredMutation();

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!target) return;
    try {
      const res = await writeOff({
        orgId,
        body: {
          variantId: target.variantId,
          branchId: target.branchId,
          warehouseId: target.warehouseId,
          reason: reason || undefined,
        },
      }).unwrap();
      toast.success(
        isPendingChange(res)
          ? "Write-off submitted for approval"
          : "Expired stock written off",
      );
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Write-off failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Write Off Expired Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-muted-foreground">
              All expired units of this item at this location will be removed
              from stock and recorded as a write-off. The exact quantity is
              recalculated when the write-off is applied.
            </p>
          </div>

          {target && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium text-right">
                  {target.variantLabel}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-right">
                  {target.locationName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Expired units</span>
                <span className="font-medium text-right">
                  {target.expiredQty}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Past expiry date"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !target}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {needsApproval ? "Submit for approval" : "Write off"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
