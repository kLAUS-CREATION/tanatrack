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
import { Receipt, Plus } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import { useGetBranchesQuery } from "@/lib/features/services/branch.api";
import { useGetSalesQuery } from "@/lib/features/services/sales.api";
import { NewSaleDialog } from "@/components/dashboard/sales/new-sale-dialog";

const SALES_CREATE = "SALES_CREATE";

export default function SalesPage() {
  const params = useParams();
  const orgId = params.dashboardId as string;

  const { isOwner, permissions } = useOrgAccess(orgId);
  const canSell = isOwner || permissions.includes(SALES_CREATE);

  const { data: sales, isLoading } = useGetSalesQuery(orgId);
  const { data: products } = useGetProductsQuery(orgId);
  const { data: branches } = useGetBranchesQuery(orgId);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mx-auto min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sales
          </h1>
          <p className="text-muted-foreground">
            Record sales and review transaction history.
          </p>
        </div>
        {canSell && (
          <Button onClick={() => setIsOpen(true)} className="gap-2 rounded-sm">
            <Plus className="h-4 w-4" /> New Sale
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-sm" />
          ))}
        </div>
      ) : !sales || sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-sm text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No sales yet</h3>
          <p className="text-muted-foreground">
            {canSell
              ? "Record your first sale to see it here."
              : "No sales have been recorded yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-background2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{s.branch?.name ?? "—"}</TableCell>
                  <TableCell>{s.customerName ?? "Walk-in"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.items?.length ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(s.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <NewSaleDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
      />
    </div>
  );
}
