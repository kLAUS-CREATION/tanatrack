"use client"

import React, { useState } from "react";
import { useGetPlansQuery } from "@/lib/features/services/plans.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanTable } from "./plans-list";
import { CreatePlanForm } from "./create-plans";
import { CreditCard, Loader2, PackagePlus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState("list");
  const { data: plans, isLoading, isFetching, refetch } = useGetPlansQuery();
  console.log("this is plans", plans);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-normal tracking-tight">Subscription Plans</h1>
          </div>
          <p className="text-muted-foreground">Configure your pricing tiers and plan capabilities.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="rounded-full">
          <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Sync Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="inline-flex">
          <TabsTrigger value="list" className="rounded-lg gap-2 px-6">
            <CreditCard className="h-4 w-4" /> Current Plans
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg gap-2 px-6">
            <PackagePlus className="h-4 w-4" /> Create Tier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
               <div className="h-64 flex items-center justify-center border rounded-xl border-dashed">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
               </div>
            ) : (
              <PlanTable data={plans || []} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="animate-in slide-in-from-bottom-2 duration-300 w-full flex flex-col gap-4 lg:gap-6">
            <CreatePlanForm onSuccess={() => setActiveTab("list")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
