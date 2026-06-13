"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { IProduct } from "@/lib/features/services/product.api";
import { IBranch } from "@/lib/features/services/branch.api";
import {
  SaleItemInput,
  useCreateSaleMutation,
} from "@/lib/features/services/sales.api";

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  products: IProduct[];
  branches: IBranch[];
}

interface Line {
  variantId: string;
  quantity: number;
}

export function NewSaleDialog({
  isOpen,
  onClose,
  orgId,
  products,
  branches,
}: NewSaleDialogProps) {
  const [branchId, setBranchId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lines, setLines] = useState<Line[]>([{ variantId: "", quantity: 1 }]);

  const [createSale, { isLoading }] = useCreateSaleMutation();

  useEffect(() => {
    if (isOpen) {
      setBranchId("");
      setCustomerName("");
      setCustomerPhone("");
      setLines([{ variantId: "", quantity: 1 }]);
    }
  }, [isOpen]);

  // variantId -> { label, price }
  const variantMap = useMemo(() => {
    const map = new Map<string, { label: string; price: number }>();
    products.forEach((p) =>
      (p.variants ?? []).forEach((v) =>
        map.set(v.id, {
          label: `${p.name} — ${v.name} (${v.sku})`,
          price: v.sellingPrice,
        }),
      ),
    );
    return map;
  }, [products]);

  const subtotal = lines.reduce((sum, l) => {
    const price = variantMap.get(l.variantId)?.price ?? 0;
    return sum + price * (l.quantity || 0);
  }, 0);

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleSubmit = async () => {
    if (!branchId) {
      toast.error("Select a branch");
      return;
    }
    const items: SaleItemInput[] = lines
      .filter((l) => l.variantId && l.quantity > 0)
      .map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    try {
      await createSale({
        orgId,
        body: {
          branchId,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          items,
        },
      }).unwrap();
      toast.success("Sale recorded");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to record sale");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer phone</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLines((prev) => [...prev, { variantId: "", quantity: 1 }])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add item
              </Button>
            </div>

            {lines.map((line, idx) => {
              const price = variantMap.get(line.variantId)?.price ?? 0;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center rounded-sm border border-border p-2"
                >
                  <div className="col-span-6">
                    <Select
                      value={line.variantId}
                      onValueChange={(v) => updateLine(idx, { variantId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(variantMap.entries()).map(([id, v]) => (
                          <SelectItem key={id} value={id}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <div className="col-span-3 text-right text-sm">
                    {formatMoney(price * (line.quantity || 0))}
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
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold">{formatMoney(subtotal)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
