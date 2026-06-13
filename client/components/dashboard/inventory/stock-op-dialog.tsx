"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IProduct } from "@/lib/features/services/product.api";
import { IBranch } from "@/lib/features/services/branch.api";
import { IWarehouse } from "@/lib/features/services/warehouse.api";
import {
  LocationInput,
  usePurchaseInMutation,
  useAdjustStockMutation,
} from "@/lib/features/services/inventory.api";

// Encode/decode a location as `branch:<id>` | `warehouse:<id>` for the Select.
export function decodeLocation(value: string): LocationInput {
  const [kind, id] = value.split(":");
  return kind === "branch" ? { branchId: id } : { warehouseId: id };
}

export function LocationOptions({
  branches,
  warehouses,
}: {
  branches: IBranch[];
  warehouses: IWarehouse[];
}) {
  return (
    <>
      {branches.length > 0 && (
        <SelectGroup>
          <SelectLabel>Branches</SelectLabel>
          {branches.map((b) => (
            <SelectItem key={b.id} value={`branch:${b.id}`}>
              {b.name}
            </SelectItem>
          ))}
        </SelectGroup>
      )}
      {warehouses.length > 0 && (
        <SelectGroup>
          <SelectLabel>Warehouses</SelectLabel>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={`warehouse:${w.id}`}>
              {w.name}
            </SelectItem>
          ))}
        </SelectGroup>
      )}
    </>
  );
}

type Mode = "purchase" | "adjust";

interface StockOpDialogProps {
  mode: Mode;
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  products: IProduct[];
  branches: IBranch[];
  warehouses: IWarehouse[];
}

export function StockOpDialog({
  mode,
  isOpen,
  onClose,
  orgId,
  products,
  branches,
  warehouses,
}: StockOpDialogProps) {
  const [variantId, setVariantId] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [purchaseIn, { isLoading: isPurchasing }] = usePurchaseInMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();
  const isLoading = isPurchasing || isAdjusting;

  useEffect(() => {
    if (isOpen) {
      setVariantId("");
      setLocation("");
      setQuantity("");
      setReason("");
    }
  }, [isOpen]);

  const variantOptions = products.flatMap((p) =>
    (p.variants ?? []).map((v) => ({
      id: v.id,
      label: `${p.name} — ${v.name} (${v.sku})`,
    })),
  );

  const handleSubmit = async () => {
    if (!variantId || !location || quantity === "") {
      toast.error("Variant, location and quantity are required");
      return;
    }
    const loc = decodeLocation(location);
    const qty = Number(quantity);
    try {
      if (mode === "purchase") {
        await purchaseIn({
          orgId,
          body: { variantId, quantity: qty, reason: reason || undefined, ...loc },
        }).unwrap();
        toast.success("Stock received");
      } else {
        await adjustStock({
          orgId,
          body: { variantId, quantity: qty, reason: reason || undefined, ...loc },
        }).unwrap();
        toast.success("Stock adjusted");
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Operation failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "purchase" ? "Receive Stock" : "Adjust Stock"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Product variant</Label>
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a variant" />
              </SelectTrigger>
              <SelectContent>
                {variantOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <LocationOptions branches={branches} warehouses={warehouses} />
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {mode === "purchase" ? "Quantity to receive" : "New counted quantity"}
            </Label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
            {mode === "adjust" && (
              <p className="text-xs text-muted-foreground">
                This sets the absolute quantity at the location.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === "purchase" ? "Supplier delivery" : "Stock count"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "purchase" ? "Receive" : "Adjust"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
