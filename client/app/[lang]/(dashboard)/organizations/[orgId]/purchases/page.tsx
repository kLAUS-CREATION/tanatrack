"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ShoppingCart, Plus, Clock } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import { useGetPurchasesQuery } from "@/lib/features/services/purchase.api";
import { useGetSuppliersQuery } from "@/lib/features/services/supplier.api";
import { NewPurchaseDialog } from "@/components/dashboard/purchases/new-purchase-dialog";

const PURCHASE_MANAGE = "PURCHASE_MANAGE";

export default function PurchasesPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  // PURCHASE_MANAGE holders and admins can record purchases; admins apply
  // instantly, makers' purchases go to the approval queue (no stock until then).
  const canPurchase =
    isOwner || canAdminister || permissions.includes(PURCHASE_MANAGE);
  const needsApproval = canPurchase && !canAdminister;

  const { data: purchases, isLoading } = useGetPurchasesQuery(orgId);
  const { data: products } = useGetProductsQuery(orgId);
  const { data: suppliers } = useGetSuppliersQuery(orgId);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <PageShell
        title="Purchases"
        subtitle="Record stock received from suppliers and review purchase history."
        actionCount={canPurchase ? 1 : 0}
        actions={
          canPurchase && (
            <Button onClick={() => setIsOpen(true)} className="gap-2 rounded-sm">
              <Plus className="h-4 w-4" /> New Purchase
            </Button>
          )
        }
        banner={
          /* Makers: heads-up that purchases route through approval before stock moves. */
          needsApproval && (
            <div className="mb-6 flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Purchases you record are submitted for approval by an
                administrator — stock is received only once approved.
              </span>
            </div>
          )
        }
        loading={isLoading}
        empty={!purchases || purchases.length === 0}
        skeletonCols={6}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="No purchases yet"
            description={
              canPurchase
                ? "Record your first purchase to bring stock in."
                : "No purchases have been recorded yet."
            }
          />
        }
      >
        <div className="rounded-sm border border-border bg-background2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Received into</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.supplier?.name ?? p.supplierName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.branch?.name ?? p.warehouse?.name ?? "Receiving pool"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.items?.length ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(p.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageShell>

      <NewPurchaseDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        orgId={orgId}
        products={products ?? []}
        suppliers={suppliers ?? []}
        needsApproval={needsApproval}
      />
    </>
  );
}
