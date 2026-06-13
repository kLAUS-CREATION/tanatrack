"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  IProductCategory,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/lib/features/services/product.api";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  categories: IProductCategory[];
}

export function CategoryManager({
  isOpen,
  onClose,
  orgId,
  categories,
}: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createCategory({ orgId, body: { name: name.trim() } }).unwrap();
      toast.success("Category created");
      setName("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create category");
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory({ orgId, categoryId }).unwrap();
      toast.success("Category deleted");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete category");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Product Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-1">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-sm border border-border px-3 py-2"
              >
                <span className="text-sm">{c.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive h-7 w-7"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
