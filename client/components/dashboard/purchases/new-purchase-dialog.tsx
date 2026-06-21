"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { variantOptions } from "@/components/dashboard/inventory/stock-fields";
import { IProduct } from "@/lib/features/services/product.api";
import { ISupplier } from "@/lib/features/services/supplier.api";
import {
  PurchaseItemInput,
  useCreatePurchaseMutation,
} from "@/lib/features/services/purchase.api";
import { isPendingChange } from "@/lib/features/services/change-request.api";

const toMinor = (n: number) => Math.round(n * 100);

// Sentinel for "no specific supplier" in the supplier Select.
const UNKNOWN_SUPPLIER = "__unknown__";

interface Line {
  variantId: string;
  quantity: number;
  unitCost: number; // major units in the form
  expiryDate?: string; // ISO yyyy-mm-dd; required for perishable variants
}

interface NewPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  products: IProduct[];
  suppliers: ISupplier[];
  /** When the actor isn't an approver, the purchase is queued for approval. */
  needsApproval?: boolean;
}

export function NewPurchaseDialog({
  isOpen,
  onClose,
  orgId,
  products,
  suppliers,
  needsApproval,
}: NewPurchaseDialogProps) {
  const [supplierId, setSupplierId] = useState(UNKNOWN_SUPPLIER);
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { variantId: "", quantity: 1, unitCost: 0 },
  ]);

  const [createPurchase, { isLoading }] = useCreatePurchaseMutation();

  useEffect(() => {
    if (isOpen) {
      setSupplierId(UNKNOWN_SUPPLIER);
      setReference("");
      setLines([{ variantId: "", quantity: 1, unitCost: 0 }]);
    }
  }, [isOpen]);

  // variantId -> { label, cost(major), perishable }
  const variantMap = useMemo(() => {
    const map = new Map<
      string,
      { label: string; cost: number; perishable: boolean }
    >();
    products.forEach((p) =>
      (p.variants ?? []).forEach((v) =>
        map.set(v.id, {
          label: `${p.name} — ${v.name} (${v.sku})`,
          cost: v.costPrice / 100,
          perishable: p.isPerishable,
        }),
      ),
    );
    return map;
  }, [products]);

  // Combobox options: variant picker (shared builder) + supplier picker.
  const variantOpts = useMemo(() => variantOptions(products), [products]);
  const supplierOpts = useMemo(
    () => [
      { value: UNKNOWN_SUPPLIER, label: "Unknown supplier" },
      ...suppliers
        .filter((s) => s.isActive)
        .map((s) => ({ value: s.id, label: s.name })),
    ],
    [suppliers],
  );

  const total = lines.reduce(
    (sum, l) => sum + l.unitCost * (l.quantity || 0),
    0,
  );

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  // When picking a variant, prefill the unit cost from the catalog cost price.
  const pickVariant = (idx: number, variantId: string) => {
    const cost = variantMap.get(variantId)?.cost ?? 0;
    updateLine(idx, { variantId, unitCost: cost });
  };

  const handleSubmit = async () => {
    const validLines = lines.filter((l) => l.variantId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    // Perishable items must carry an expiry date (the server rejects otherwise).
    const missingExpiry = validLines.some(
      (l) => variantMap.get(l.variantId)?.perishable && !l.expiryDate,
    );
    if (missingExpiry) {
      toast.error("Set an expiry date for each perishable item");
      return;
    }
    const items: PurchaseItemInput[] = validLines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      unitCost: toMinor(l.unitCost || 0),
      expiryDate:
        variantMap.get(l.variantId)?.perishable && l.expiryDate
          ? new Date(l.expiryDate).toISOString()
          : undefined,
    }));
    try {
      const res = await createPurchase({
        orgId,
        body: {
          supplierId: supplierId === UNKNOWN_SUPPLIER ? undefined : supplierId,
          reference: reference || undefined,
          items,
        },
      }).unwrap();
      toast.success(
        isPendingChange(res)
          ? "Purchase submitted for approval"
          : "Purchase recorded — stock received into the receiving pool",
      );
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to record purchase");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Combobox
                options={supplierOpts}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="Supplier"
                searchPlaceholder="Search suppliers…"
                emptyText="No suppliers found."
              />
            </div>
            <div className="space-y-2">
              <Label>Reference / Invoice #</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Received stock goes into the receiving pool. Allocate it to a branch or
            warehouse afterwards from the Inventory page.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    { variantId: "", quantity: 1, unitCost: 0 },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add item
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-2 px-1 text-xs text-muted-foreground">
              <span className="col-span-6">Product</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-2">Unit cost</span>
              <span className="col-span-2 text-right">Line</span>
            </div>

            {lines.map((line, idx) => {
              const isPerishable = !!variantMap.get(line.variantId)?.perishable;
              return (
                <div
                  key={idx}
                  className="space-y-2 rounded-sm border border-border p-2"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Combobox
                        options={variantOpts}
                        value={line.variantId}
                        onChange={(v) => pickVariant(idx, v)}
                        placeholder="Select product"
                        searchPlaceholder="Search products…"
                        emptyText="No products found."
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, { quantity: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={line.unitCost}
                        onChange={(e) =>
                          updateLine(idx, { unitCost: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm">
                      {formatMoney(toMinor(line.unitCost * (line.quantity || 0)))}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {lines.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-7 w-7"
                          onClick={() =>
                            setLines((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {isPerishable && (
                    <div className="flex items-center gap-2 pl-1">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        Expiry date
                      </Label>
                      <Input
                        type="date"
                        className="h-8 max-w-[200px]"
                        value={line.expiryDate ?? ""}
                        onChange={(e) =>
                          updateLine(idx, { expiryDate: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total cost</span>
            <span className="text-lg font-semibold">
              {formatMoney(toMinor(total))}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {needsApproval ? "Submit for approval" : "Record Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
