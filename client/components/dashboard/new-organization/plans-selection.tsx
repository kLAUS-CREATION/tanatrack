import React from "react";
import { useGetPlansQuery } from "@/lib/features/services/plans.api";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlansSelectionProps {
  selectedPlanId: string;
  onSelect: (id: string) => void;
}

export default function PlansSelection({ selectedPlanId, onSelect }: PlansSelectionProps) {
  const { data: plans, isLoading } = useGetPlansQuery();

  if (isLoading) return <div className="w-full flex justify-center py-20"><Zap className="animate-spin text-primary" /></div>;

  return (
    <section className="w-full lg:w-[60%] px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans?.filter(p => p.isPublic && p.isActive).map((plan) => {
          const isSelected = selectedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              className={cn(
                "relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300",
                "hover:shadow-md hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 shadow-inner ring-1 ring-primary"
                  : "border-border bg-background"
              )}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1 shadow-lg">
                  <Check className="h-4 w-4" />
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{plan.tagline}</p>
                </div>
                {plan.badge && (
                  <div className="text-[10px] uppercase font-bold">
                    {plan.badge}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <span className="text-2xl font-black">{plan.currency} {plan.monthlyPrice}</span>
                <span className="text-muted-foreground text-xs ml-1">/month</span>
              </div>

              <ul className="space-y-2">
                {plan.planFeatures?.slice(0, 4).map((pf) => (
                  <li key={pf.featureId} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span className="line-clamp-1">
                      {pf.value} {pf.feature?.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
