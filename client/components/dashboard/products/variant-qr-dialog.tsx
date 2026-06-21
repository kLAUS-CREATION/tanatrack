"use client";

import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { IProductVariant } from "@/lib/features/services/product.api";

export function variantQrValue(orgId: string, variantId: string): string {
  return `tana:v1:${orgId}:${variantId}`;
}

interface VariantQrDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  variant: IProductVariant | null;
}

export function VariantQrDialog({
  isOpen,
  onClose,
  orgId,
  variant,
}: VariantQrDialogProps) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  if (!variant) return null;

  const value = variantQrValue(orgId, variant.id);

  const handleDownload = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${variant.sku || variant.id}.png`;
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-90">
        <DialogHeader>
          <DialogTitle>Variant QR code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div
            ref={canvasWrapRef}
            className="rounded-sm bg-white p-4"
          >
            <QRCodeCanvas
              value={value}
              size={280}
              level="M"
              marginSize={2}
            />
          </div>
          <div className="w-full space-y-1 text-center">
            <p className="font-medium">{variant.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {variant.sku}
            </p>
            <p className="text-sm">{formatMoney(variant.sellingPrice)}</p>
          </div>
          <Button onClick={handleDownload} className="w-full gap-2 rounded-sm">
            <Download className="h-4 w-4" /> Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
