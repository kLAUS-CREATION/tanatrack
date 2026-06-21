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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Loader2, Plus, Trash2, Pencil, QrCode } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import {
  IProduct,
  IProductVariant,
  isPendingChange,
  useAddVariantMutation,
  useDeleteVariantMutation,
} from "@/lib/features/services/product.api";
import { VariantEditDialog } from "./variant-edit-dialog";
import { VariantQrDialog } from "./variant-qr-dialog";

const toMinor = (n: number) => Math.round(n * 100);

interface VariantManagerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  product: IProduct | null;
}

export function VariantManager({
  isOpen,
  onClose,
  orgId,
  product,
}: VariantManagerProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [editing, setEditing] = useState<IProductVariant | null>(null);
  const [qrVariant, setQrVariant] = useState<IProductVariant | null>(null);

  const [addVariant, { isLoading: isAdding }] = useAddVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();
  const [ConfirmDialog, confirm] = useConfirm();

  if (!product) return null;

  const handleAdd = async () => {
    if (!sku.trim() || !name.trim()) {
      toast.error("SKU and name are required");
      return;
    }
    try {
      const res = await addVariant({
        orgId,
        productId: product.id,
        body: {
          sku: sku.trim(),
          name: name.trim(),
          sellingPrice: toMinor(Number(price) || 0),
        },
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Variant submitted for approval" : "Variant added",
      );
      setSku("");
      setName("");
      setPrice("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add variant");
    }
  };

  const handleDelete = async (variantId: string) => {
    const ok = await confirm({
      title: "Remove variant?",
      description:
        "This permanently removes the variant from this product. This action cannot be undone.",
      confirmText: "Remove",
    });
    if (!ok) return;
    try {
      const res = await deleteVariant({
        orgId,
        productId: product.id,
        variantId,
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Removal submitted for approval" : "Variant removed",
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove variant");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{product.name} — Variants</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-12 gap-2">
            <Input
              className="col-span-3"
              placeholder="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <Input
              className="col-span-4"
              placeholder="Name (e.g. Large)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              className="col-span-3"
              type="number"
              step="0.01"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Button className="col-span-2" onClick={handleAdd} disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="rounded-sm border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants?.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{formatMoney(v.sellingPrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="QR code"
                          onClick={() => setQrVariant(v)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Edit"
                          onClick={() => setEditing(v)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-7 w-7"
                          title="Remove"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        </DialogContent>
      </Dialog>
      <VariantEditDialog
        key={editing?.id ?? "none"}
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        orgId={orgId}
        productId={product.id}
        variant={editing}
      />
      <VariantQrDialog
        isOpen={!!qrVariant}
        onClose={() => setQrVariant(null)}
        orgId={orgId}
        variant={qrVariant}
      />
      {ConfirmDialog}
    </>
  );
}
