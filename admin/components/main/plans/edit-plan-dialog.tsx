"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdatePlanMutation } from "@/lib/features/services/plans.api";
import { IPlan } from "@/types/plans";

interface Props {
  plan: IPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = {
  name: string;
  description: string;
  badge: string;
  currency: string;
  monthlyPrice: string; // major units in the field
  yearlyPrice: string;
  trialDays: string;
  sortOrder: string;
  isActive: boolean;
  isPublic: boolean;
};

const toMajor = (minor?: number) => (minor ? String(minor / 100) : "0");

export function EditPlanDialog({ plan, open, onOpenChange }: Props) {
  const [updatePlan, { isLoading }] = useUpdatePlanMutation();
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        description: plan.description ?? "",
        badge: plan.badge ?? "",
        currency: plan.currency,
        monthlyPrice: toMajor(plan.monthlyPrice),
        yearlyPrice: toMajor(plan.yearlyPrice),
        trialDays: String(plan.trialDays ?? 0),
        sortOrder: String(plan.sortOrder ?? 0),
        isActive: plan.isActive,
        isPublic: plan.isPublic,
      });
    }
  }, [plan]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!plan || !form) return;
    try {
      await updatePlan({
        id: plan.id,
        body: {
          name: form.name,
          description: form.description || undefined,
          badge: form.badge || undefined,
          currency: form.currency,
          monthlyPrice: Math.round(Number(form.monthlyPrice) * 100),
          yearlyPrice: Math.round(Number(form.yearlyPrice) * 100),
          trialDays: Number(form.trialDays),
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
          isPublic: form.isPublic,
        },
      }).unwrap();
      toast.success("Plan updated");
      onOpenChange(false);
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to update plan";
      toast.error(message);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit · {plan?.name}</DialogTitle>
          <DialogDescription>
            Update the plan details. Prices are entered in {form.currency}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Badge</Label>
              <Input
                placeholder="e.g. Most popular"
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Input
                maxLength={3}
                value={form.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Monthly price</Label>
              <Input
                type="number"
                value={form.monthlyPrice}
                onChange={(e) => set("monthlyPrice", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Yearly price</Label>
              <Input
                type="number"
                value={form.yearlyPrice}
                onChange={(e) => set("yearlyPrice", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Trial days</Label>
              <Input
                type="number"
                value={form.trialDays}
                onChange={(e) => set("trialDays", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Selectable by organizations
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Public</p>
              <p className="text-xs text-muted-foreground">
                Shown on the pricing page
              </p>
            </div>
            <Switch
              checked={form.isPublic}
              onCheckedChange={(v) => set("isPublic", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
