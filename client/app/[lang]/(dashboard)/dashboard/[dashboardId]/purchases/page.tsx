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
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Plus } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import { useGetBranchesQuery } from "@/lib/features/services/branch.api";
import { useGetWarehousesQuery } from "@/lib/features/services/warehouse.api";
import { useGetPurchasesQuery } from "@/lib/features/services/purchase.api";
import { NewPurchaseDialog } from "@/components/dashboard/purchases/new-purchase-dialog";

const INVENTORY_PURCHASE_IN = "INVENTORY_PURCHASE_IN";

export default function PurchasesPage() {
  const params = useParams();
  const orgId = params.dashboardId as string;

  const { isOwner, permissions } = useOrgAccess(orgId);
  const canPurchase = isOwner || permissions.includes(INVENTORY_PURCHASE_IN);

  const { data: purchases, isLoading } = useGetPurchasesQuery(orgId);
  const { data: products } = useGetProductsQuery(orgId);
  const { data: branches } = useGetBranchesQuery(orgId);
  const { data: warehouses } = useGetWarehousesQuery(orgId);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mx-auto min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Purchases
          </h1>
          <p className="text-muted-foreground">
            Record stock received from suppliers and review purchase history.
          </p>
        </div>
        {canPurchase && (
          <Button onClick={() => setIsOpen(true)} className="gap-2 rounded-sm">
            <Plus className="h-4 w-4" /> New Purchase
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-sm" />
          ))}
        </div>
      ) : !purchases || purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-sm text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No purchases yet</h3>
          <p className="text-muted-foreground">
            {canPurchase
              ? "Record your first purchase to bring stock in."
              : "No purchases have been recorded yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-background2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.supplierName ?? "—"}
                  </TableCell>
                  <TableCell>
                    {p.branch?.name ?? p.warehouse?.name ?? "—"}
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
      )}

      <NewPurchaseDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
      />
    </div>
  );
}
