"use client";

import React, { useMemo, useState } from "react";
import {
  useGetPlansQuery,
  useDeletePlanMutation,
} from "@/lib/features/services/plans.api";
import { IPlan } from "@/types/plans";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { FilterToolbar } from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import { useConfirm } from "@/components/ui/confirm-dialog";

import { PlanTable } from "./plans-list";
import { CreatePlanDialog } from "./create-plan-dialog";
import { EditPlanDialog } from "./edit-plan-dialog";
import { SyncFeaturesDialog } from "./sync-features-dialog";

const PAGE_SIZE = 10;

export default function PlansPage() {
  const { data: plans, isLoading } = useGetPlansQuery();
  const [deletePlan] = useDeletePlanMutation();
  const [ConfirmDialog, confirm] = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<IPlan | null>(null);
  const [syncPlan, setSyncPlan] = useState<IPlan | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const all = useMemo(() => plans ?? [], [plans]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [all, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleDelete = async (plan: IPlan) => {
    const ok = await confirm({
      title: "Delete plan?",
      description: `"${plan.name}" will be deactivated and hidden from pricing. Existing subscriptions are not affected.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await deletePlan(plan.id).unwrap();
      toast.success("Plan deleted");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to delete plan";
      toast.error(message);
    }
  };

  const addButton = (
    <Button onClick={() => setCreateOpen(true)} className="gap-2">
      <Plus className="h-4 w-4" /> Create Plan
    </Button>
  );

  return (
    <>
      <PageShell
        title="Subscription Plans"
        subtitle="Configure your pricing tiers and the features each one unlocks."
        actions={addButton}
        loading={isLoading}
        empty={all.length === 0}
        emptyState={
          <EmptyState
            icon={CreditCard}
            title="No plans yet"
            description="Create your first subscription tier to start selling."
            action={addButton}
          />
        }
        skeletonCols={6}
      >
        <div className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search plans by name or slug…"
            chips={[]}
            onClearAll={() => {
              setSearch("");
              setPage(1);
            }}
            resultCount={filtered.length}
            totalCount={all.length}
          />

          <PlanTable
            data={paged}
            onEdit={setEditPlan}
            onSync={setSyncPlan}
            onDelete={handleDelete}
          />

          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      </PageShell>

      <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditPlanDialog
        plan={editPlan}
        open={!!editPlan}
        onOpenChange={(open) => !open && setEditPlan(null)}
      />
      <SyncFeaturesDialog
        plan={syncPlan}
        open={!!syncPlan}
        onOpenChange={(open) => !open && setSyncPlan(null)}
      />
      {ConfirmDialog}
    </>
  );
}
