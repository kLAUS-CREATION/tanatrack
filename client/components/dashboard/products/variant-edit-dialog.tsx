"use client";

import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  IProductVariant,
  isPendingChange,
  useUpdateVariantMutation,
} from "@/lib/features/services/product.api";

const toMinor = (n: number) => Math.round(n * 100);
const fromMinor = (minor: number) => (minor / 100).toString();

interface VariantEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  productId: string;
  variant: IProductVariant | null;
}

export function VariantEditDialog({
  isOpen,
  onClose,
  orgId,
  productId,
  variant,
}: VariantEditDialogProps) {
  // State is seeded directly from the variant. The parent passes a `key` tied to
  // the variant id, so this component remounts per variant and the initializers
  // always reflect the row being edited — no syncing effect needed.
  const [name, setName] = useState(variant?.name ?? "");
  const [sku, setSku] = useState(variant?.sku ?? "");
  const [sellingPrice, setSellingPrice] = useState(
    variant ? fromMinor(variant.sellingPrice) : "",
  );
  const [costPrice, setCostPrice] = useState(
    variant ? fromMinor(variant.costPrice) : "",
  );
  const [barcode, setBarcode] = useState(variant?.barcode ?? "");
  const [isActive, setIsActive] = useState(variant?.isActive ?? true);

  const [updateVariant, { isLoading }] = useUpdateVariantMutation();

  if (!variant) return null;

  const handleSave = async () => {
    if (!sku.trim() || !name.trim()) {
      toast.error("SKU and name are required");
      return;
    }
    try {
      const res = await updateVariant({
        orgId,
        productId,
        variantId: variant.id,
        body: {
          sku: sku.trim(),
          name: name.trim(),
          barcode: barcode.trim() || undefined,
          sellingPrice: toMinor(Number(sellingPrice) || 0),
          costPrice: toMinor(Number(costPrice) || 0),
          isActive,
        },
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Update submitted for approval" : "Variant updated",
      );
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update variant");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Edit variant</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="variant-name">Name</Label>
            <Input
              id="variant-name"
              placeholder="e.g. Large"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="variant-sku">SKU</Label>
              <Input
                id="variant-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variant-barcode">Barcode</Label>
              <Input
                id="variant-barcode"
                placeholder="Optional"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="variant-selling">Selling price</Label>
              <Input
                id="variant-selling"
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variant-cost">Cost price</Label>
              <Input
                id="variant-cost"
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isActive}
              onCheckedChange={(c) => setIsActive(c === true)}
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="rounded-sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
