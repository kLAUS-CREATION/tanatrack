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
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import { IProduct } from "@/lib/features/services/product.api";
import { IBranch } from "@/lib/features/services/branch.api";
import { IWarehouse } from "@/lib/features/services/warehouse.api";
import { useCreateAllocationMutation } from "@/lib/features/services/allocation.api";
import { isPendingChange } from "@/lib/features/services/change-request.api";
import {
  LocationCombobox,
  decodeLocation,
  variantOptions,
} from "./stock-fields";

interface AllocateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  products: IProduct[];
  branches: IBranch[];
  warehouses: IWarehouse[];
  /** When the actor isn't an approver, the move is queued for approval. */
  needsApproval?: boolean;
}

export function AllocateDialog({
  isOpen,
  onClose,
  orgId,
  products,
  branches,
  warehouses,
  needsApproval,
}: AllocateDialogProps) {
  const [variantId, setVariantId] = useState("");
  const [to, setTo] = useState("");
  const [quantity, setQuantity] = useState("");

  const [createAllocation, { isLoading }] = useCreateAllocationMutation();

  useEffect(() => {
    if (isOpen) {
      setVariantId("");
      setTo("");
      setQuantity("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!variantId || !to || quantity === "") {
      toast.error("Product, destination and quantity are required");
      return;
    }
    try {
      const res = await createAllocation({
        orgId,
        body: {
          variantId,
          quantity: Number(quantity),
          ...decodeLocation(to),
        },
      }).unwrap();
      toast.success(
        isPendingChange(res)
          ? "Allocation submitted for approval"
          : "Stock allocated",
      );
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Allocation failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Allocate Received Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">
            Move purchased stock from the receiving pool to a branch or warehouse.
          </p>

          <div className="space-y-2">
            <Label>Product variant</Label>
            <Combobox
              options={variantOptions(products)}
              value={variantId}
              onChange={setVariantId}
              placeholder="Select a variant"
              searchPlaceholder="Search products…"
              emptyText="No products found."
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Input value="Receiving pool" disabled readOnly />
            </div>
            <ArrowRight className="h-4 w-4 mb-3 text-muted-foreground" />
            <div className="space-y-2">
              <Label>To</Label>
              <LocationCombobox
                branches={branches}
                warehouses={warehouses}
                value={to}
                onChange={setTo}
                placeholder="Destination"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {needsApproval ? "Submit for approval" : "Allocate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
