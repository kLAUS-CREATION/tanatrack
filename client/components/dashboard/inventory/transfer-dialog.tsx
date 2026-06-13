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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { IProduct } from "@/lib/features/services/product.api";
import { IBranch } from "@/lib/features/services/branch.api";
import { IWarehouse } from "@/lib/features/services/warehouse.api";
import { useTransferStockMutation } from "@/lib/features/services/inventory.api";
import {
  LocationOptions,
  decodeLocation,
} from "./stock-op-dialog";

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  products: IProduct[];
  branches: IBranch[];
  warehouses: IWarehouse[];
}

export function TransferDialog({
  isOpen,
  onClose,
  orgId,
  products,
  branches,
  warehouses,
}: TransferDialogProps) {
  const [variantId, setVariantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [quantity, setQuantity] = useState("");

  const [transferStock, { isLoading }] = useTransferStockMutation();

  useEffect(() => {
    if (isOpen) {
      setVariantId("");
      setFrom("");
      setTo("");
      setQuantity("");
    }
  }, [isOpen]);

  const variantOptions = products.flatMap((p) =>
    (p.variants ?? []).map((v) => ({
      id: v.id,
      label: `${p.name} — ${v.name} (${v.sku})`,
    })),
  );

  const handleSubmit = async () => {
    if (!variantId || !from || !to || quantity === "") {
      toast.error("All fields are required");
      return;
    }
    if (from === to) {
      toast.error("Source and destination must differ");
      return;
    }
    try {
      await transferStock({
        orgId,
        body: {
          variantId,
          quantity: Number(quantity),
          from: decodeLocation(from),
          to: decodeLocation(to),
        },
      }).unwrap();
      toast.success("Stock transferred");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Transfer failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
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

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <LocationOptions branches={branches} warehouses={warehouses} />
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="h-4 w-4 mb-3 text-muted-foreground" />
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  <LocationOptions branches={branches} warehouses={warehouses} />
                </SelectContent>
              </Select>
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
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
