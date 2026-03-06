import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetFeaturesQuery } from "@/lib/features/services/feature.api";
import { useSyncPlanFeaturesMutation } from "@/lib/features/services/plans.api";
import { IPlan, PlanFeatureInput } from "@/types/plans";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  plan: IPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncFeaturesDialog({ plan, open, onOpenChange }: Props) {
  const { data: allFeatures } = useGetFeaturesQuery();
  const [syncFeatures] = useSyncPlanFeaturesMutation();
  const [selectedFeatures, setSelectedFeatures] = useState<PlanFeatureInput[]>([]);

  // Initialize with existing plan features
  useEffect(() => {
    if (plan?.planFeatures) {
      setSelectedFeatures(
        plan.planFeatures.map(pf => ({
          featureId: pf.featureId,
          value: pf.value,
          overrideDescription: pf.overrideDescription
        }))
      );
    }
  }, [plan]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.find(f => f.featureId === featureId)
        ? prev.filter(f => f.featureId !== featureId)
        : [...prev, { featureId, value: "true", overrideDescription: "" }]
    );
  };

  const updateValue = (featureId: string, value: string) => {
    setSelectedFeatures(prev => prev.map(f =>
      f.featureId === featureId ? { ...f, value } : f
    ));
  };

  const handleSave = async () => {
    if (!plan) return;
    await syncFeatures({ id: plan.id, body: { features: selectedFeatures } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Features for {plan?.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {allFeatures?.map((feature) => {
              const selection = selectedFeatures.find(f => f.featureId === feature.id);
              return (
                <div key={feature.id} className="flex items-center space-x-4 border-b pb-4">
                  <Checkbox
                    checked={!!selection}
                    onCheckedChange={() => toggleFeature(feature.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs text-muted-foreground">{feature.key}</p>
                  </div>
                  {selection && (
                    <Input
                      className="w-32 h-8"
                      placeholder="Value (e.g. 50)"
                      value={selection.value}
                      onChange={(e) => updateValue(feature.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
