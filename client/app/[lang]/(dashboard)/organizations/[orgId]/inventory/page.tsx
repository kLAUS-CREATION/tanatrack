"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, PackageCheck, AlertTriangle } from "lucide-react";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import { useGetBranchesQuery } from "@/lib/features/services/branch.api";
import { useGetWarehousesQuery } from "@/lib/features/services/warehouse.api";
import {
  useGetGlobalStockQuery,
  useGetMovementsQuery,
  useGetLowStockQuery,
  useGetBatchesQuery,
} from "@/lib/features/services/inventory.api";
import { TransferDialog } from "@/components/dashboard/inventory/transfer-dialog";
import { AllocateDialog } from "@/components/dashboard/inventory/allocate-dialog";
import { StockLevelsTab } from "@/components/dashboard/inventory/stock-levels-tab";
import { MovementsTab } from "@/components/dashboard/inventory/movements-tab";
import { ExpiryTab } from "@/components/dashboard/inventory/expiry-tab";

// "See inventory": gates visibility of this page. "Manage inventory": gates the
// allocate/transfer stock-move actions (maker-checker — queued unless owner/admin).
const INVENTORY_VIEW = "INVENTORY_VIEW_GLOBAL_STOCK";
const INVENTORY_MANAGE = "INVENTORY_MANAGE";

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const orgId = params.orgId as string;

  const { isOwner, canAdminister, permissions, isLoading: accessLoading } =
    useOrgAccess(orgId);
  // "See inventory" gates the whole page. Owner/admin always see it.
  const canViewInventory =
    isOwner || canAdminister || permissions.includes(INVENTORY_VIEW);
  // INVENTORY_MANAGE gates stock moves (allocate pool→location and transfer
  // location→location). Holders queue a change request; owner/admins apply instantly.
  const canManageStock =
    isOwner || canAdminister || permissions.includes(INVENTORY_MANAGE);
  const moveNeedsApproval = canManageStock && !isOwner && !canAdminister;

  // Redirect members without "see inventory" away from the page (UX-only; the
  // backend independently enforces every read/write).
  useEffect(() => {
    if (!accessLoading && !canViewInventory) {
      router.replace(`/${lang}/organizations/${orgId}`);
    }
  }, [accessLoading, canViewInventory, router, lang, orgId]);

  const { data: stock, isLoading } = useGetGlobalStockQuery(orgId, {
    skip: !canViewInventory,
  });
  const { data: movements } = useGetMovementsQuery(
    { orgId },
    { skip: !canViewInventory },
  );
  const { data: products } = useGetProductsQuery(orgId, {
    skip: !canViewInventory,
  });
  const { data: branches } = useGetBranchesQuery(orgId, {
    skip: !canViewInventory,
  });
  const { data: warehouses } = useGetWarehousesQuery(orgId, {
    skip: !canViewInventory,
  });
  const { data: lowStock } = useGetLowStockQuery(orgId, {
    skip: !canViewInventory,
  });
  const { data: batches } = useGetBatchesQuery(orgId, {
    skip: !canViewInventory,
  });

  const [transferOpen, setTransferOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);

  if (accessLoading || !canViewInventory) return null;

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
          {canManageStock && (
            <Button
              variant="outline"
              className="gap-2 rounded-lg transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              onClick={() => setAllocateOpen(true)}
            >
              <PackageCheck className="h-4 w-4" /> Allocate
            </Button>
          )}
          {canManageStock && (
            <Button
              variant="outline"
              className="gap-2 rounded-lg transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </Button>
          )}
        </div>
      </div>

      {lowStock && lowStock.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {lowStock.length} item{lowStock.length > 1 ? "s" : ""} at or below
              reorder point
            </p>
            <p className="text-muted-foreground">
              {lowStock
                .slice(0, 4)
                .map(
                  (l) =>
                    `${l.variant?.product?.name ?? "Item"} · ${l.variant?.name ?? ""} (${
                      l.quantity
                    } left${
                      l.branch?.name || l.warehouse?.name
                        ? ` @ ${l.branch?.name ?? l.warehouse?.name}`
                        : ""
                    })`,
                )
                .join(", ")}
              {lowStock.length > 4 && ` +${lowStock.length - 4} more`}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="stock" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Movements</TabsTrigger>
          <TabsTrigger value="expiry" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Expiry</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-6">
          <StockLevelsTab stock={stock ?? []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <MovementsTab movements={movements ?? []} />
        </TabsContent>

        <TabsContent value="expiry" className="mt-6">
          <ExpiryTab
            batches={batches ?? []}
            orgId={orgId}
            canManageStock={canManageStock}
            needsApproval={moveNeedsApproval}
          />
        </TabsContent>
      </Tabs>

      <TransferDialog
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
        needsApproval={moveNeedsApproval}
      />
      <AllocateDialog
        isOpen={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        orgId={orgId}
        products={products ?? []}
        branches={branches ?? []}
        warehouses={warehouses ?? []}
        needsApproval={moveNeedsApproval}
      />
    </div>
  );
}
