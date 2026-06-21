import React from "react";
import { useGetPlansQuery } from "@/lib/features/services/plans.api";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingInterval } from "@/types/organization";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlansSelectionProps {
  selectedPlanId: string;
  planInterval: BillingInterval;
  onSelect: (id: string) => void;
  onUpdatePlanInterval: (planInterval: BillingInterval) => void;
}

export default function PlansSelection({ selectedPlanId, onSelect, planInterval, onUpdatePlanInterval }: PlansSelectionProps) {
  const { data: plans, isLoading } = useGetPlansQuery();

  if (isLoading) return <div className="w-full flex justify-center py-20"><Zap className="animate-spin text-primary" /></div>;

  return (
    <section className="w-full lg:w-[70%] space-y-5">
      <div>
         <Tabs  defaultValue={BillingInterval.MONTHLY} className="w-[80%] lg:w-[50%] 2xl:w-[40%]">
            <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger onClick={ () => onUpdatePlanInterval(BillingInterval.MONTHLY)} value={BillingInterval.MONTHLY}>Monthly</TabsTrigger>
                <TabsTrigger onClick={ () => onUpdatePlanInterval(BillingInterval.YEARLY)} value={BillingInterval.YEARLY}>Yearly (Save 20%)</TabsTrigger>
            </TabsList>
         </Tabs>
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {plans?.filter(p => p.isPublic && p.isActive).map((plan) => {
          const isSelected = selectedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              className={cn(
                "relative cursor-pointer rounded-lg border-1 p-5 transition-all duration-300 w-[50%] lg:w-[33%] 2xl:w-[24%]",
                "hover:shadow-md hover:border-foreground-secondary",
                isSelected
                  ? "border-foreground/80 bg-primary/2 dark:bg-primary/3 shadow-inner ring-1 ring-primary/40"
                  : "border-border bg-background"
              )}
            >
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
                <span className="text-2xl font-black">{plan.currency} {planInterval === BillingInterval.MONTHLY ? plan.monthlyPrice : plan.yearlyPrice}</span>
                <span className="text-muted-foreground text-xs ml-1">{ planInterval === BillingInterval.MONTHLY ? BillingInterval.MONTHLY : BillingInterval.YEARLY }</span>
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
