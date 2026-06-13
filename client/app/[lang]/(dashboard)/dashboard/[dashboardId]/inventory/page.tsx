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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Boxes, PackagePlus, SlidersHorizontal, ArrowLeftRight } from "lucide-react";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import { useGetBranchesQuery } from "@/lib/features/services/branch.api";
import { useGetWarehousesQuery } from "@/lib/features/services/warehouse.api";
import {
  IStockLevel,
  IStockMovement,
  useGetGlobalStockQuery,
  useGetMovementsQuery,
} from "@/lib/features/services/inventory.api";
import { StockOpDialog } from "@/components/dashboard/inventory/stock-op-dialog";
import { TransferDialog } from "@/components/dashboard/inventory/transfer-dialog";

const INVENTORY_ADJUST = "INVENTORY_ADJUST_STOCK";
const INVENTORY_PURCHASE = "INVENTORY_PURCHASE_IN";
const INVENTORY_TRANSFER = "INVENTORY_TRANSFER_STOCK";

function locationName(s: IStockLevel) {
  return s.branch?.name ?? s.warehouse?.name ?? "—";
}

function movementLocation(m: IStockMovement) {
  const from = m.fromBranch?.name ?? m.fromWarehouse?.name;
  const to = m.toBranch?.name ?? m.toWarehouse?.name;
  if (from && to) return `${from} → ${to}`;
  if (to) return `→ ${to}`;
  if (from) return `${from} →`;
  return "—";
}

export default function InventoryPage() {
  const params = useParams();
  const orgId = params.dashboardId as string;

  const { isOwner, permissions } = useOrgAccess(orgId);
  const can = (p: string) => isOwner || permissions.includes(p);

  const { data: stock, isLoading } = useGetGlobalStockQuery(orgId);
  const { data: movements } = useGetMovementsQuery({ orgId });
  const { data: products } = useGetProductsQuery(orgId);
  const { data: branches } = useGetBranchesQuery(orgId);
  const { data: warehouses } = useGetWarehousesQuery(orgId);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="w-full mx-auto min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="text-muted-foreground">
            Stock levels across every branch and warehouse.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can(INVENTORY_PURCHASE) && (
            <Button
              variant="outline"
              className="gap-2 rounded-sm"
              onClick={() => setPurchaseOpen(true)}
            >
              <PackagePlus className="h-4 w-4" /> Receive
            </Button>
          )}
          {can(INVENTORY_TRANSFER) && (
            <Button
              variant="outline"
              className="gap-2 rounded-sm"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </Button>
          )}
          {can(INVENTORY_ADJUST) && (
            <Button
              className="gap-2 rounded-sm"
              onClick={() => setAdjustOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" /> Adjust
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-sm" />
              ))}
            </div>
          ) : !stock || stock.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-sm text-center">
              <Boxes className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No stock yet</h3>
              <p className="text-muted-foreground">
                Receive stock into a location to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-background2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((s) => {
                    const low =
                      s.reorderPoint != null && s.quantity <= s.reorderPoint;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.variant?.product?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {s.variant?.name}{" "}
                          <span className="text-xs text-muted-foreground font-mono">
                            {s.variant?.sku}
                          </span>
                        </TableCell>
                        <TableCell>{locationName(s)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={low ? "destructive" : "secondary"}>
                            {s.quantity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          {!movements || movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-sm text-center">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No movements yet</h3>
              <p className="text-muted-foreground">
                Stock changes will appear here as an audit trail.
              </p>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-background2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.variant?.product?.name} — {m.variant?.name}
                      </TableCell>
                      <TableCell>{movementLocation(m)}</TableCell>
                      <TableCell className="text-right">{m.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <StockOpDialog
        mode="purchase"
        isOpen={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
      />
      <StockOpDialog
        mode="adjust"
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
      />
      <TransferDialog
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
      />
    </div>
  );
}
