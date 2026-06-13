"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Edit, Trash2, Layers, FolderTree } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import {
  IProduct,
  CreateProductRequest,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/lib/features/services/product.api";
import { ProductForm } from "@/components/dashboard/products/product-form";
import { CategoryManager } from "@/components/dashboard/products/category-manager";
import { VariantManager } from "@/components/dashboard/products/variant-manager";

const PRODUCTS_MANAGE = "PRODUCTS_MANAGE";

function priceRange(p: IProduct): string {
  const prices = (p.variants ?? []).map((v) => v.sellingPrice);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

export default function ProductsPage() {
  const params = useParams();
  const orgId = params.dashboardId as string;

  const { isOwner, permissions } = useOrgAccess(orgId);
  const canManage = isOwner || permissions.includes(PRODUCTS_MANAGE);

  const { data: products, isLoading } = useGetProductsQuery(orgId);
  const { data: categories } = useGetCategoriesQuery(orgId);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<IProduct | null>(null);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<IProduct | null>(null);

  const handleSubmit = async (data: CreateProductRequest) => {
    try {
      if (editing) {
        await updateProduct({
          orgId,
          productId: editing.id,
          body: {
            name: data.name,
            description: data.description,
            categoryId: data.categoryId,
            unit: data.unit,
          },
        }).unwrap();
        toast.success("Product updated");
      } else {
        await createProduct({ orgId, body: data }).unwrap();
        toast.success("Product created");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product and all its variants?")) return;
    try {
      await deleteProduct({ orgId, productId }).unwrap();
      toast.success("Product deleted");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="w-full mx-auto min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground">
            Your organization-wide product catalog.
          </p>
        </div>
        {canManage && (
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
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-sm" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-sm text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No products yet</h3>
          <p className="text-muted-foreground">
            {canManage
              ? "Create your first product to start tracking stock."
              : "No products have been added yet."}
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
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
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
                          title="Manage variants"
                          onClick={() => setVariantProduct(p)}
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
        </div>
      )}

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
      <VariantManager
        isOpen={!!variantProduct}
        onClose={() => setVariantProduct(null)}
        orgId={orgId}
        product={variantProduct}
      />
    </div>
  );
}
