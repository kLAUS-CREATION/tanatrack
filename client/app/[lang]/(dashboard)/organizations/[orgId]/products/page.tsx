"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { FilterToolbar, type ActiveChip } from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import { Package, Edit, Trash2, Layers, FolderTree, FilterX } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import {
  IProduct,
  CreateProductRequest,
  isPendingChange,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/lib/features/services/product.api";
import { ProductForm } from "@/components/dashboard/products/product-form";
import { CategoryManager } from "@/components/dashboard/products/category-manager";
import { PendingProductChanges } from "@/components/dashboard/products/pending-product-changes";
import { useConfirm } from "@/components/ui/confirm-dialog";

const PRODUCTS_MANAGE = "PRODUCTS_MANAGE";

const ALL = "__all__";
const UNCATEGORIZED = "__uncat__";
type StatusFilter = typeof ALL | "active" | "inactive";

function priceRange(p: IProduct): string {
  const prices = (p.variants ?? []).map((v) => v.sellingPrice);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

export default function ProductsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const lang = params.lang as string;
  const router = useRouter();
  const productsBase = `/${lang}/organizations/${orgId}/products`;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  // Admins (ADMINISTRATION_ACCESS) and PRODUCTS_MANAGE holders can both manage
  // the catalog; admins apply instantly, makers' changes go to the approval queue.
  const canManage =
    isOwner || canAdminister || permissions.includes(PRODUCTS_MANAGE);
  const needsApproval = canManage && !canAdminister;

  const { data: products, isLoading } = useGetProductsQuery(orgId);
  const { data: categories } = useGetCategoriesQuery(orgId);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<IProduct | null>(null);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState<StatusFilter>(ALL);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  React.useEffect(() => {
    setPage(1);
  }, [search, category, status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (category === UNCATEGORIZED) {
        if (p.categoryId) return false;
      } else if (category !== ALL && p.categoryId !== category) {
        return false;
      }
      if (status !== ALL && p.isActive !== (status === "active")) return false;
      if (q) {
        const hay = [
          p.name,
          p.description,
          p.category?.name,
          ...(p.variants ?? []).flatMap((v) => [v.name, v.sku]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, category, status]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const chips: ActiveChip[] = [];
  if (category !== ALL)
    chips.push({
      key: "category",
      label:
        category === UNCATEGORIZED
          ? "Uncategorized"
          : categories?.find((c) => c.id === category)?.name ?? "Category",
      onRemove: () => setCategory(ALL),
    });
  if (status !== ALL)
    chips.push({
      key: "status",
      label: status === "active" ? "Active" : "Inactive",
      onRemove: () => setStatus(ALL),
    });

  const clearAll = () => {
    setSearch("");
    setCategory(ALL);
    setStatus(ALL);
  };

  const handleSubmit = async (data: CreateProductRequest) => {
    try {
      if (editing) {
        const res = await updateProduct({
          orgId,
          productId: editing.id,
          body: {
            name: data.name,
            description: data.description,
            categoryId: data.categoryId,
            unit: data.unit,
            isPerishable: data.isPerishable,
          },
        }).unwrap();
        toast.success(
          isPendingChange(res) ? "Update submitted for approval" : "Product updated",
        );
      } else {
        const res = await createProduct({ orgId, body: data }).unwrap();
        toast.success(
          isPendingChange(res)
            ? "Product submitted for approval"
            : "Product created",
        );
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (productId: string) => {
    const ok = await confirm({
      title: needsApproval ? "Request product deletion?" : "Delete product?",
      description: needsApproval
        ? "This sends a request to delete this product to an administrator for approval."
        : "This permanently deletes the product and all of its variants. This action cannot be undone.",
      confirmText: needsApproval ? "Submit request" : "Delete",
    });
    if (!ok) return;
    try {
      const res = await deleteProduct({ orgId, productId }).unwrap();
      toast.success(
        isPendingChange(res) ? "Deletion submitted for approval" : "Product deleted",
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete product");
    }
  };

  return (
    <>
      <PageShell
        title="Products"
        subtitle="Your organization-wide product catalog."
        actionCount={canManage ? 2 : 0}
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsCatOpen(true)} className="gap-2 rounded-sm">
                <FolderTree className="h-4 w-4" /> Categories
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setIsFormOpen(true);
                }}
                className="gap-2 rounded-sm"
              >
                <Package className="h-4 w-4" /> Add Product
              </Button>
            </div>
          )
        }
        banner={
          <>
            {/* Approvers see the queue; makers see a heads-up that changes need sign-off. */}
            {canAdminister && <PendingProductChanges orgId={orgId} />}
            {needsApproval && (
              <div className="mb-6 rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
                Your product changes are submitted for approval by an
                administrator before they take effect.
              </div>
            )}
          </>
        }
        loading={isLoading}
        empty={!products || products.length === 0}
        skeletonCols={canManage ? 7 : 6}
        emptyState={
          <EmptyState
            icon={Package}
            title="No products yet"
            description={
              canManage
                ? "Create your first product to start tracking stock."
                : "No products have been added yet."
            }
          />
        }
      >
        <div className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by product, variant, SKU or category…"
            chips={chips}
            onClearAll={clearAll}
            resultCount={filtered.length}
            totalCount={products?.length ?? 0}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as StatusFilter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterToolbar>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-sm text-center">
              <FilterX className="h-8 w-8 mb-3 text-muted-foreground/60" />
              <p className="font-medium">No matches</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting or clearing your filters.
              </p>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-background2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`${productsBase}/${p.id}`}
                      className="text-foreground transition-colors hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.category?.name ?? "—"}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell>{p.variants?.length ?? 0}</TableCell>
                  <TableCell>{priceRange(p)}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "default" : "secondary"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Open product & variants"
                          onClick={() => router.push(`${productsBase}/${p.id}`)}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          onClick={() => {
                            setEditing(p);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          title="Delete"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </PageShell>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        categories={categories ?? []}
        isLoading={isCreating || isUpdating}
      />
      <CategoryManager
        isOpen={isCatOpen}
        onClose={() => setIsCatOpen(false)}
        orgId={orgId}
        categories={categories ?? []}
      />
      {ConfirmDialog}
    </>
  );
}
