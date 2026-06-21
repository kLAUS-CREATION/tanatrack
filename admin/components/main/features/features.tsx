"use client";

import React, { useMemo, useState } from "react";
import {
  useGetFeaturesQuery,
  useDeleteFeatureMutation,
} from "@/lib/features/services/feature.api";
import { FeatureCategory, IFeature } from "@/types/features";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LayoutGrid, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import {
  FilterToolbar,
  type ActiveChip,
} from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FeatureTable } from "./features-list";
import { CreateFeatureDialog } from "./create-feature";

const PAGE_SIZE = 10;

export default function FeaturesPage() {
  const { data: features, isLoading } = useGetFeaturesQuery();
  const [deleteFeature] = useDeleteFeatureMutation();
  const [ConfirmDialog, confirm] = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  const all = useMemo(() => features ?? [], [features]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((f) => {
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q);
      const matchesCategory = category === "all" || f.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [all, search, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const chips: ActiveChip[] = [];
  if (category !== "all") {
    chips.push({
      key: "category",
      label: `Category: ${category.toLowerCase()}`,
      onRemove: () => setCategory("all"),
    });
  }

  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setPage(1);
  };

  const handleDelete = async (feature: IFeature) => {
    const ok = await confirm({
      title: "Delete feature?",
      description: `"${feature.name}" will be removed and detached from any plans using it.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await deleteFeature(feature.id).unwrap();
      toast.success("Feature deleted");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to delete feature";
      toast.error(message);
    }
  };

  const addButton = (
    <Button onClick={() => setCreateOpen(true)} className="gap-2">
      <Plus className="h-4 w-4" /> Add Feature
    </Button>
  );

  return (
    <>
      <PageShell
        title="Features"
        subtitle="The catalog of capabilities you can bundle into plans."
        actions={addButton}
        loading={isLoading}
        empty={all.length === 0}
        emptyState={
          <EmptyState
            icon={LayoutGrid}
            title="No features yet"
            description="Create your first feature to start building subscription plans."
            action={addButton}
          />
        }
        skeletonCols={5}
      >
        <div className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search by name or key…"
            chips={chips}
            onClearAll={clearAll}
            resultCount={filtered.length}
            totalCount={all.length}
          >
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.values(FeatureCategory).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterToolbar>

          <FeatureTable data={paged} onDelete={handleDelete} />

          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      </PageShell>

      <CreateFeatureDialog open={createOpen} onOpenChange={setCreateOpen} />
      {ConfirmDialog}
    </>
  );
}
