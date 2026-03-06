"use client"

import React, { useState } from "react";
import { useGetFeaturesQuery } from "@/lib/features/services/feature.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureTable } from "./features-list";
import { CreateFeatureForm } from "./create-feature";
import { LayoutGrid, PlusCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState("list");
  const { data: features, isLoading, isFetching, refetch } = useGetFeaturesQuery();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl tracking-tight">Feature Management</h1>
          <p className="text-muted-foreground">Manage your system flags and feature toggles.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" /> All Features
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="">
          <div className="">
            <div>
              <h2>Features</h2>
              <p>A list of all features available in your application.</p>
            </div>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-10"><RefreshCcw className="animate-spin h-8 w-8 text-primary" /></div>
              ) : (
                <FeatureTable data={features || []} />
              )}
            </CardContent>
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card className="w-full mx-auto rounded-xs border-primary/30 bg-background2">
            <CardHeader>
              <CardTitle>Create Feature</CardTitle>
              <CardDescription>Define a new feature key and type for your system.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateFeatureForm onSuccess={() => setActiveTab("list")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
