"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  ISupplier,
  CreateSupplierRequest,
} from "@/lib/features/services/supplier.api";

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierRequest) => Promise<void> | void;
  initialData?: ISupplier | null;
  isLoading?: boolean;
}

const EMPTY: CreateSupplierRequest = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function SupplierForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: SupplierFormProps) {
  const [form, setForm] = useState<CreateSupplierRequest>(EMPTY);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      initialData
        ? {
            name: initialData.name,
            contactPerson: initialData.contactPerson ?? "",
            phone: initialData.phone ?? "",
            email: initialData.email ?? "",
            address: initialData.address ?? "",
            notes: initialData.notes ?? "",
          }
        : EMPTY,
    );
  }, [isOpen, initialData]);

  const set = (patch: Partial<CreateSupplierRequest>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    // Trim and drop empty optional fields so we don't store empty strings.
    const payload: CreateSupplierRequest = {
      name: form.name.trim(),
      contactPerson: form.contactPerson?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      address: form.address?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit supplier" : "Add supplier"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Acme Distribution"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Contact person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => set({ contactPerson: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Optional"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !form.name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save changes" : "Add supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
