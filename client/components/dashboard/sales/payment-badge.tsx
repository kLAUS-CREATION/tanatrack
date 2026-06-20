import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/features/services/sales.api";

const LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  UNPAID: "Unpaid",
  PARTIALLY_REFUNDED: "Part. refunded",
  REFUNDED: "Refunded",
};

const STYLES: Record<PaymentStatus, string> = {
  PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  PARTIAL: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  UNPAID: "border-red-500/30 bg-red-500/10 text-red-600",
  PARTIALLY_REFUNDED: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  REFUNDED: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-normal", STYLES[status])}
    >
      {LABELS[status]}
    </Badge>
  );
}
