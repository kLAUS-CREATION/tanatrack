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
import { TableSkeleton } from "@/components/dashboard/shared/table-skeleton";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { Boxes, PackagePlus, SlidersHorizontal, ArrowLeftRight, PackageCheck } from "lucide-react";
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
import { AllocateDialog } from "@/components/dashboard/inventory/allocate-dialog";

const INVENTORY_ADJUST = "INVENTORY_ADJUST_STOCK";
const INVENTORY_PURCHASE = "INVENTORY_PURCHASE_IN";
const INVENTORY_TRANSFER = "INVENTORY_TRANSFER_STOCK";
const INVENTORY_MANAGE = "INVENTORY_MANAGE";

function locationName(s: IStockLevel) {
  if (s.branch?.name) return s.branch.name;
  if (s.warehouse?.name) return s.warehouse.name;
  return "Unallocated (Receiving)";
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
  const orgId = params.orgId as string;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  const can = (p: string) => isOwner || permissions.includes(p);
  // INVENTORY_MANAGE holders queue allocations; owner/admins apply instantly.
  const canAllocate = isOwner || canAdminister || permissions.includes(INVENTORY_MANAGE);
  const allocationNeedsApproval = canAllocate && !isOwner && !canAdminister;

  const { data: stock, isLoading } = useGetGlobalStockQuery(orgId);
  const { data: movements } = useGetMovementsQuery({ orgId });
  const { data: products } = useGetProductsQuery(orgId);
  const { data: branches } = useGetBranchesQuery(orgId);
  const { data: warehouses } = useGetWarehousesQuery(orgId);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);

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
        <div className="flex items-center gap-3">
          {canAllocate && (
            <Button
              variant="outline"
              className="gap-2 rounded-lg transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              onClick={() => setAllocateOpen(true)}
            >
              <PackageCheck className="h-4 w-4" /> Allocate
            </Button>
          )}
          {can(INVENTORY_PURCHASE) && (
            <Button
              variant="outline"
              className="gap-2 rounded-lg transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              onClick={() => setPurchaseOpen(true)}
            >
              <PackagePlus className="h-4 w-4" /> Receive
            </Button>
          )}
          {can(INVENTORY_TRANSFER) && (
            <Button
              variant="outline"
              className="gap-2 rounded-lg transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </Button>
          )}
          {can(INVENTORY_ADJUST) && (
            <Button
              className="gap-2 rounded-lg shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
              onClick={() => setAdjustOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" /> Adjust
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="stock" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-6">
          {isLoading ? (
            <TableSkeleton cols={4} />
          ) : !stock || stock.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No stock yet"
              description="Receive stock into a location to get started with your inventory management."
            />
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
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

        <TabsContent value="movements" className="mt-6">
          {!movements || movements.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No movements yet"
              description="Stock changes will appear here as a comprehensive audit trail."
            />
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
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
      <AllocateDialog
        isOpen={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
        needsApproval={allocationNeedsApproval}
      />
    </div>
  );
}
