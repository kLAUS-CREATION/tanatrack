"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetFeaturesQuery } from "@/lib/features/services/feature.api";
import { useSyncPlanFeaturesMutation } from "@/lib/features/services/plans.api";
import { IPlan, PlanFeatureInput } from "@/types/plans";
import { FeatureType, IFeature } from "@/types/features";

interface Props {
  plan: IPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncFeaturesDialog({ plan, open, onOpenChange }: Props) {
  const { data: allFeatures } = useGetFeaturesQuery();
  const [syncFeatures, { isLoading }] = useSyncPlanFeaturesMutation();
  const [selected, setSelected] = useState<PlanFeatureInput[]>([]);

  // Seed selection from the plan's current features whenever it changes.
  useEffect(() => {
    if (plan?.planFeatures) {
      setSelected(
        plan.planFeatures.map((pf) => ({
          featureId: pf.featureId,
          value: pf.value,
          overrideDescription: pf.overrideDescription,
        })),
      );
    } else {
      setSelected([]);
    }
  }, [plan]);

  // Group the catalog by category for a scannable list.
  const grouped = useMemo(() => {
    const map = new Map<string, IFeature[]>();
    (allFeatures ?? []).forEach((f) => {
      const key = f.category ?? "OTHER";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allFeatures]);

  const defaultValue = (type: FeatureType) =>
    type === FeatureType.BOOLEAN ? "true" : type === FeatureType.NUMBER ? "0" : "";

  const toggle = (feature: IFeature) => {
    setSelected((prev) =>
      prev.find((f) => f.featureId === feature.id)
        ? prev.filter((f) => f.featureId !== feature.id)
        : [
            ...prev,
            { featureId: feature.id, value: defaultValue(feature.type) },
          ],
    );
  };

  const updateValue = (featureId: string, value: string) =>
    setSelected((prev) =>
      prev.map((f) => (f.featureId === featureId ? { ...f, value } : f)),
    );

  const handleSave = async () => {
    if (!plan) return;
    try {
      await syncFeatures({ id: plan.id, body: { features: selected } }).unwrap();
      toast.success(`Features updated for ${plan.name}`);
      onOpenChange(false);
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to update features";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Features · {plan?.name}</DialogTitle>
          <DialogDescription>
            Toggle features into this plan and set each limit. {selected.length}{" "}
            selected.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[460px] pr-4">
          <div className="space-y-6">
            {grouped.map(([category, features]) => (
              <div key={category}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category.toLowerCase()}
                </p>
                <div className="space-y-1">
                  {features.map((feature) => {
                    const selection = selected.find(
                      (f) => f.featureId === feature.id,
                    );
                    const isOn = !!selection;
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 hover:border-border hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={isOn}
                          onCheckedChange={() => toggle(feature)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {feature.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {feature.key} · {feature.type.toLowerCase()}
                          </p>
                        </div>

                        {isOn && (
                          <div className="shrink-0">
                            {feature.type === FeatureType.BOOLEAN ? (
                              <Switch
                                checked={selection!.value === "true"}
                                onCheckedChange={(v) =>
                                  updateValue(feature.id, v ? "true" : "false")
                                }
                              />
                            ) : feature.type === FeatureType.NUMBER ? (
                              <Input
                                type="number"
                                className="h-8 w-28"
                                placeholder="limit"
                                value={selection!.value}
                                onChange={(e) =>
                                  updateValue(feature.id, e.target.value)
                                }
                              />
                            ) : (
                              <Input
                                className="h-8 w-40"
                                placeholder="a, b, c"
                                value={selection!.value}
                                onChange={(e) =>
                                  updateValue(feature.id, e.target.value)
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

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
