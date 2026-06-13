"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  IProduct,
  IProductCategory,
  ProductUnit,
  CreateProductRequest,
} from "@/lib/features/services/product.api";

// Prices are entered in major currency units and stored as integer minor units.
const toMinor = (n: number) => Math.round(n * 100);
const fromMinor = (n: number) => n / 100;

const variantSchema = z.object({
  sku: z.string().min(1, "SKU required"),
  name: z.string().min(1, "Variant name required"),
  barcode: z.string().optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
});

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.nativeEnum(ProductUnit),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  // Returns the product payload; for edit, only base fields are used.
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  initialData?: IProduct | null;
  categories: IProductCategory[];
  isLoading?: boolean;
}

const NONE = "__none__";

export function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  isLoading,
}: ProductFormProps) {
  const isEdit = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: NONE,
      unit: ProductUnit.PIECE,
      variants: [{ sku: "", name: "", barcode: "", costPrice: 0, sellingPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        categoryId: initialData.categoryId || NONE,
        unit: initialData.unit,
        variants:
          initialData.variants?.length
            ? initialData.variants.map((v) => ({
                sku: v.sku,
                name: v.name,
                barcode: v.barcode || "",
                costPrice: fromMinor(v.costPrice),
                sellingPrice: fromMinor(v.sellingPrice),
              }))
            : [{ sku: "", name: "", barcode: "", costPrice: 0, sellingPrice: 0 }],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        categoryId: NONE,
        unit: ProductUnit.PIECE,
        variants: [
          { sku: "", name: "", barcode: "", costPrice: 0, sellingPrice: 0 },
        ],
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: ProductFormValues) => {
    const payload: CreateProductRequest = {
      name: values.name,
      description: values.description || undefined,
      categoryId:
        values.categoryId && values.categoryId !== NONE
          ? values.categoryId
          : undefined,
      unit: values.unit,
      // Variants only sent on create; edit updates base fields only.
      variants: isEdit
        ? undefined
        : values.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            barcode: v.barcode || undefined,
            costPrice: toMinor(v.costPrice),
            sellingPrice: toMinor(v.sellingPrice),
          })),
    };
    await onSubmit(payload);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Create New Product"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Coca-Cola 500ml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Uncategorized" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Uncategorized</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ProductUnit).map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Variants</FormLabel>
                {!isEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      append({
                        sku: "",
                        name: "",
                        barcode: "",
                        costPrice: 0,
                        sellingPrice: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add variant
                  </Button>
                )}
              </div>

              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Manage variants from the product&apos;s variants action after saving.
                </p>
              )}

              {!isEdit &&
                fields.map((f, idx) => (
                  <div
                    key={f.id}
                    className="grid grid-cols-12 gap-2 items-start rounded-sm border border-border p-2"
                  >
                    <div className="col-span-3">
                      <Input
                        placeholder="SKU"
                        {...form.register(`variants.${idx}.sku`)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Name (e.g. Large)"
                        {...form.register(`variants.${idx}.name`)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Cost"
                        {...form.register(`variants.${idx}.costPrice`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        {...form.register(`variants.${idx}.sellingPrice`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => remove(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              {form.formState.errors.variants && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.variants.message as string}
                </p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
