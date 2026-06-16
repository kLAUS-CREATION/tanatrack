"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { Combobox } from "@/components/ui/combobox";
import { variantOptions } from "@/components/dashboard/inventory/stock-op-dialog";
import { IProduct } from "@/lib/features/services/product.api";
import { IBranch } from "@/lib/features/services/branch.api";
import {
  SaleItemInput,
  useCreateSaleMutation,
} from "@/lib/features/services/sales.api";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "@/lib/features/services/customer.api";

// Sentinel for "no saved customer" in the customer picker.
const WALK_IN = "__walkin__";
const CUSTOMERS_MANAGE = "CUSTOMERS_MANAGE";

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  products: IProduct[];
  branches: IBranch[];
}

interface Line {
  variantId: string;
  quantity: number;
}

export function NewSaleDialog({
  isOpen,
  onClose,
  orgId,
  products,
  branches,
}: NewSaleDialogProps) {
  const [branchId, setBranchId] = useState("");
  const [customerId, setCustomerId] = useState(WALK_IN);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lines, setLines] = useState<Line[]>([{ variantId: "", quantity: 1 }]);

  // Inline "new customer" mini-form (shown on demand for CUSTOMERS_MANAGE holders).
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  const canManageCustomers =
    isOwner || canAdminister || permissions.includes(CUSTOMERS_MANAGE);

  const { data: customers } = useGetCustomersQuery(orgId);
  const [createSale, { isLoading }] = useCreateSaleMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();

  useEffect(() => {
    if (isOpen) {
      setBranchId("");
      setCustomerId(WALK_IN);
      setCustomerName("");
      setCustomerPhone("");
      setLines([{ variantId: "", quantity: 1 }]);
      setCreatingCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    }
  }, [isOpen]);

  // variantId -> { label, price }
  const variantMap = useMemo(() => {
    const map = new Map<string, { label: string; price: number }>();
    products.forEach((p) =>
      (p.variants ?? []).forEach((v) =>
        map.set(v.id, {
          label: `${p.name} — ${v.name} (${v.sku})`,
          price: v.sellingPrice,
        }),
      ),
    );
    return map;
  }, [products]);

  const variantOpts = useMemo(() => variantOptions(products), [products]);
  const branchOpts = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches],
  );
  const customerOpts = useMemo(
    () => [
      { value: WALK_IN, label: "Walk-in (no customer)" },
      ...(customers ?? []).map((c) => ({
        value: c.id,
        label: c.phone ? `${c.name} (${c.phone})` : c.name,
        keywords: [c.name, c.phone ?? ""],
      })),
    ],
    [customers],
  );

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      const created = await createCustomer({
        orgId,
        body: {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
        },
      }).unwrap();
      setCustomerId(created.id);
      setCreatingCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      toast.success("Customer created");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create customer");
    }
  };

  const subtotal = lines.reduce((sum, l) => {
    const price = variantMap.get(l.variantId)?.price ?? 0;
    return sum + price * (l.quantity || 0);
  }, 0);

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleSubmit = async () => {
    if (!branchId) {
      toast.error("Select a branch");
      return;
    }
    const items: SaleItemInput[] = lines
      .filter((l) => l.variantId && l.quantity > 0)
      .map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    const isWalkIn = customerId === WALK_IN;
    try {
      await createSale({
        orgId,
        body: {
          branchId,
          customerId: isWalkIn ? undefined : customerId,
          // Free-text name/phone only apply to walk-in sales; a saved customer's
          // details are snapshotted server-side from the customerId.
          customerName: isWalkIn ? customerName || undefined : undefined,
          customerPhone: isWalkIn ? customerPhone || undefined : undefined,
          items,
        },
      }).unwrap();
      toast.success("Sale recorded");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to record sale");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Combobox
                options={branchOpts}
                value={branchId}
                onChange={setBranchId}
                placeholder="Select branch"
                searchPlaceholder="Search branches…"
                emptyText="No branches found."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Customer</Label>
                {canManageCustomers && !creatingCustomer && (
                  <button
                    type="button"
                    onClick={() => setCreatingCustomer(true)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> New customer
                  </button>
                )}
              </div>
              <Combobox
                options={customerOpts}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Select customer"
                searchPlaceholder="Search customers…"
                emptyText="No customers found."
              />
            </div>
          </div>

          {/* Inline "new customer" mini-form (CUSTOMERS_MANAGE holders). */}
          {creatingCustomer && (
            <div className="rounded-sm border border-border bg-muted/20 p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>New customer name *</Label>
                  <Input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Abebe Bekele"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCreateCustomer()
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatingCustomer(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCustomer}
                  disabled={isCreatingCustomer || !newCustomerName.trim()}
                >
                  {isCreatingCustomer && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save customer
                </Button>
              </div>
            </div>
          )}

          {/* Walk-in sales may still carry an optional free-text name/phone. */}
          {customerId === WALK_IN && !creatingCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Walk-in name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Walk-in phone</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLines((prev) => [...prev, { variantId: "", quantity: 1 }])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add item
              </Button>
            </div>

            {lines.map((line, idx) => {
              const price = variantMap.get(line.variantId)?.price ?? 0;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center rounded-sm border border-border p-2"
                >
                  <div className="col-span-6">
                    <Combobox
                      options={variantOpts}
                      value={line.variantId}
                      onChange={(v) => updateLine(idx, { variantId: v })}
                      placeholder="Select product"
                      searchPlaceholder="Search products…"
                      emptyText="No products found."
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, { quantity: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="col-span-3 text-right text-sm">
                    {formatMoney(price * (line.quantity || 0))}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive h-7 w-7"
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold">{formatMoney(subtotal)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
