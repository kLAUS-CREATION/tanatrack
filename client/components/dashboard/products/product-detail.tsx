"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import {
  FilterToolbar,
  type ActiveChip,
} from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import {
  ArrowLeft,
  Package,
  Layers,
  Edit,
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Loader2,
  FilterX,
  Boxes,
  CircleDollarSign,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import {
  IProductVariant,
  CreateProductRequest,
  isPendingChange,
  useGetProductQuery,
  useUpdateProductMutation,
  useAddVariantMutation,
  useDeleteVariantMutation,
  useGetCategoriesQuery,
} from "@/lib/features/services/product.api";
import { ProductForm } from "@/components/dashboard/products/product-form";
import { VariantEditDialog } from "@/components/dashboard/products/variant-edit-dialog";
import { VariantQrDialog } from "@/components/dashboard/products/variant-qr-dialog";

const PRODUCTS_MANAGE = "PRODUCTS_MANAGE";
const ALL = "__all__";
type StatusFilter = typeof ALL | "active" | "inactive";

const toMinor = (n: number) => Math.round(n * 100);

function priceRange(variants: IProductVariant[]): string {
  const prices = variants.map((v) => v.sellingPrice);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatMoney(min)
    : `${formatMoney(min)} – ${formatMoney(max)}`;
}

export function ProductDetail() {
  const params = useParams();
  const orgId = params.orgId as string;
  const lang = params.lang as string;
  const productId = params.productId as string;
  const productsHref = `/${lang}/organizations/${orgId}/products`;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  const canManage =
    isOwner || canAdminister || permissions.includes(PRODUCTS_MANAGE);
  const needsApproval = canManage && !canAdminister;

  const { data: product, isLoading, isError } = useGetProductQuery({
    orgId,
    productId,
  });
  const { data: categories } = useGetCategoriesQuery(orgId);

  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [addVariant, { isLoading: isAdding }] = useAddVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();
  const [ConfirmDialog, confirm] = useConfirm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<IProductVariant | null>(
    null,
  );
  const [qrVariant, setQrVariant] = useState<IProductVariant | null>(null);

  // Quick-add row
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(ALL);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  React.useEffect(() => {
    setPage(1);
  }, [search, status]);

  const variants = useMemo(() => product?.variants ?? [], [product]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return variants.filter((v) => {
      if (status !== ALL && v.isActive !== (status === "active")) return false;
      if (q) {
        const hay = [v.name, v.sku, v.barcode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [variants, search, status]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const activeCount = useMemo(
    () => variants.filter((v) => v.isActive).length,
    [variants],
  );

  const chips: ActiveChip[] = [];
  if (status !== ALL)
    chips.push({
      key: "status",
      label: status === "active" ? "Active" : "Inactive",
      onRemove: () => setStatus(ALL),
    });

  const clearAll = () => {
    setSearch("");
    setStatus(ALL);
  };

  const handleUpdateProduct = async (data: CreateProductRequest) => {
    if (!product) return;
    try {
      const res = await updateProduct({
        orgId,
        productId: product.id,
        body: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          unit: data.unit,
        },
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Update submitted for approval" : "Product updated",
      );
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save product");
    }
  };

  const handleAddVariant = async () => {
    if (!product) return;
    if (!sku.trim() || !name.trim()) {
      toast.error("SKU and name are required");
      return;
    }
    try {
      const res = await addVariant({
        orgId,
        productId: product.id,
        body: {
          sku: sku.trim(),
          name: name.trim(),
          sellingPrice: toMinor(Number(price) || 0),
        },
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Variant submitted for approval" : "Variant added",
      );
      setSku("");
      setName("");
      setPrice("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add variant");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!product) return;
    const ok = await confirm({
      title: needsApproval ? "Request variant removal?" : "Remove variant?",
      description: needsApproval
        ? "This sends a request to remove this variant to an administrator for approval."
        : "This permanently removes the variant from this product. This action cannot be undone.",
      confirmText: needsApproval ? "Submit request" : "Remove",
    });
    if (!ok) return;
    try {
      const res = await deleteVariant({
        orgId,
        productId: product.id,
        variantId,
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Removal submitted for approval" : "Variant removed",
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove variant");
    }
  };

  /* ---- Loading ---- */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-28 w-full rounded-sm" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-sm" />
          <Skeleton className="h-24 rounded-sm" />
          <Skeleton className="h-24 rounded-sm" />
        </div>
        <Skeleton className="h-64 w-full rounded-sm" />
      </div>
    );
  }

  /* ---- Not found / no access ---- */
  if (isError || !product) {
    return (
      <div className="flex flex-col">
        <BackLink href={productsHref} />
        <EmptyState
          icon={Package}
          title="Product not found"
          description="It may have been removed, or you don't have access to it."
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <BackLink href={productsHref} />

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-sm border border-border bg-background2 p-5 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {product.name}
                </h1>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{product.category?.name ?? "Uncategorized"}</span>
                <span className="text-border">•</span>
                <span>Unit: {product.unit}</span>
              </p>
              {product.description && (
                <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
          </div>
          {canManage && (
            <Button
              variant="outline"
              className="gap-2 rounded-sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Edit className="h-4 w-4" /> Edit product
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Layers} label="Variants" value={String(variants.length)} />
          <StatCard
            icon={Boxes}
            label="Active variants"
            value={`${activeCount} / ${variants.length}`}
          />
          <StatCard
            icon={CircleDollarSign}
            label="Price range"
            value={priceRange(variants)}
          />
        </div>

        {/* Maker note */}
        {needsApproval && (
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
            Your variant changes are submitted for approval by an administrator
            before they take effect.
          </div>
        )}

        {/* Variants */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Variants</h2>

          {/* Quick add */}
          {canManage && (
            <div className="grid grid-cols-12 gap-2 rounded-sm border border-border bg-background2 p-3">
              <Input
                className="col-span-6 sm:col-span-3"
                placeholder="SKU"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <Input
                className="col-span-6 sm:col-span-4"
                placeholder="Name (e.g. Large)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                className="col-span-8 sm:col-span-3"
                type="number"
                step="0.01"
                placeholder="Selling price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddVariant();
                }}
              />
              <Button
                className="col-span-4 sm:col-span-2 gap-2"
                onClick={handleAddVariant}
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add
                  </>
                )}
              </Button>
            </div>
          )}

          {variants.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No variants yet"
              description={
                canManage
                  ? "Add a variant above so this product can be stocked and sold."
                  : "This product has no variants yet."
              }
            />
          ) : (
            <>
              <FilterToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by variant, SKU or barcode…"
                chips={chips}
                onClearAll={clearAll}
                resultCount={filtered.length}
                totalCount={variants.length}
              >
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
                <div className="flex flex-col items-center justify-center rounded-sm border border-dashed py-12 text-center">
                  <FilterX className="mb-3 h-8 w-8 text-muted-foreground/60" />
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
                        <TableHead>SKU</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Barcode</TableHead>
                        {canManage && <TableHead>Cost</TableHead>}
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono text-xs">
                            {v.sku}
                          </TableCell>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {v.barcode || "—"}
                          </TableCell>
                          {canManage && (
                            <TableCell className="tabular-nums text-muted-foreground">
                              {formatMoney(v.costPrice)}
                            </TableCell>
                          )}
                          <TableCell className="tabular-nums">
                            {formatMoney(v.sellingPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={v.isActive ? "default" : "secondary"}>
                              {v.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="QR code"
                                onClick={() => setQrVariant(v)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              {canManage && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    title="Edit"
                                    onClick={() => setEditingVariant(v)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive"
                                    title="Remove"
                                    onClick={() => handleDeleteVariant(v.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
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
            </>
          )}
        </div>
      </div>

      {canManage && (
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleUpdateProduct}
          initialData={product}
          categories={categories ?? []}
          isLoading={isUpdating}
        />
      )}
      <VariantEditDialog
        key={editingVariant?.id ?? "none"}
        isOpen={!!editingVariant}
        onClose={() => setEditingVariant(null)}
        orgId={orgId}
        productId={product.id}
        variant={editingVariant}
      />
      <VariantQrDialog
        isOpen={!!qrVariant}
        onClose={() => setQrVariant(null)}
        orgId={orgId}
        variant={qrVariant}
      />
      {ConfirmDialog}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Products
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-border bg-background2 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
