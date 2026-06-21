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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Loader2, Plus, Trash2, Pencil, Check, X, Search } from "lucide-react";
import { toast } from "sonner";
import {
  IProductCategory,
  isPendingChange,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
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
  const [search, setSearch] = useState("");
  // Inline edit state: the category currently being renamed and its draft name.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [ConfirmDialog, confirm] = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await createCategory({
        orgId,
        body: { name: name.trim() },
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Category submitted for approval" : "Category created",
      );
      setName("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create category");
    }
  };

  const startEdit = (c: IProductCategory) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async (categoryId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      const res = await updateCategory({
        orgId,
        categoryId,
        body: { name: trimmed },
      }).unwrap();
      toast.success(
        isPendingChange(res) ? "Update submitted for approval" : "Category updated",
      );
      cancelEdit();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update category");
    }
  };

  const handleDelete = async (categoryId: string) => {
    const ok = await confirm({
      title: "Delete category?",
      description:
        "Products in this category won't be deleted, but they'll no longer be grouped under it.",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      const res = await deleteCategory({ orgId, categoryId }).unwrap();
      toast.success(
        isPendingChange(res) ? "Deletion submitted for approval" : "Category deleted",
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete category");
    }
  };

  return (
    <>
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

            {categories.length > 0 && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search categories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            <div className="space-y-1">
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No categories yet.</p>
              )}
              {categories.length > 0 && filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No categories match “{search}”.
                </p>
              )}
              {filtered.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-sm border border-border px-3 py-2"
                  >
                    {isEditing ? (
                      <>
                        <Input
                          autoFocus
                          className="h-8"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(c.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary"
                            title="Save"
                            disabled={isUpdating || !editName.trim()}
                            onClick={() => handleUpdate(c.id)}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Cancel"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">{c.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Rename"
                            onClick={() => startEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive h-7 w-7"
                            title="Delete"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </>
  );
}
