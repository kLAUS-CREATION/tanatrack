import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus, Trash2, Rocket, Info, CreditCard,
  Loader2, Settings2, ListPlus, Hash, CheckSquare, AlignLeft
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";

import { useCreatePlanMutation } from "@/lib/features/services/plans.api";
import { useGetFeaturesQuery } from "@/lib/features/services/feature.api";
import { PlanType } from "@/types/plans";

// Added FeatureType Enum for logic
export enum FeatureType {
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  LIST = 'LIST',
}

const planSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens only"),
  type: z.nativeEnum(PlanType),
  description: z.string().optional(),
  badge: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  currency: z.string().min(3).max(3).default("ETB"),
  monthlyPrice: z.coerce.number().min(0),
  yearlyPrice: z.coerce.number().min(0),
  trialDays: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  features: z.array(z.object({
    featureId: z.string().min(1, "Select a feature"),
    value: z.string().min(1, "Value is required"),
    overrideDescription: z.string().optional(),
  })).default([]),
});

type PlanFormValues = z.infer<typeof planSchema>;

export function CreatePlanForm({ onSuccess }: { onSuccess: () => void }) {
  const [createPlan, { isLoading }] = useCreatePlanMutation();
  const { data: availableFeatures } = useGetFeaturesQuery();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "", slug: "", type: PlanType.FREE,
      currency: "ETB", monthlyPrice: 0, yearlyPrice: 0,
      isActive: true, isPublic: true, features: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  async function onSubmit(values: PlanFormValues) {
    try {
      await createPlan(values).unwrap();
      toast.success("Subscription plan created!");
      form.reset();
      onSuccess();
    } catch (e) {
      toast.error("Failed to create plan.");
    }
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <div className="flex flex-col gap-2 lg:gap-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> General Identity
              </h3>
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={PlanType.FREE}>FREE</SelectItem>
                        <SelectItem value={PlanType.PRO}>PAID</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          <Separator />

          {/* SECTION 2: PRICING (Omitted for brevity, keep as is) */}
          <div className="flex flex-col gap-2 lg:gap-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Pricing & Logic
              </h3>
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="monthlyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Monthly Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="yearlyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Yearly Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
              </div>
            </div>
          </div>

          <Separator />

          {/* SECTION 3: FEATURE BUNDLE (UPDATED) */}
          <div className="flex flex-col gap-2 lg:gap-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ListPlus className="h-5 w-5 text-primary" /> Feature Bundle
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure specific limits. Input adapts based on feature type.
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ featureId: "", value: "false", overrideDescription: "" })}
                  className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" /> Link Feature
                </Button>
              </div>

              <div className="grid gap-3">
                {fields.map((field, index) => {
                  // Watch the selected featureId for this row
                  const selectedId = form.watch(`features.${index}.featureId`);
                  // Find the feature metadata to determine the type
                  const featureMeta = availableFeatures?.find(f => f.id === selectedId);

                  return (
                    <div key={field.id} className="flex gap-3 items-center p-4 border border-primary/20 rounded-lg bg-card animate-in slide-in-from-top-2">

                      {/* Feature Selector */}
                      <FormField
                        control={form.control}
                        name={`features.${index}.featureId`}
                        render={({ field }) => (
                          <FormItem className="flex-[2]">
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                // Set a sensible default value when feature changes
                                const meta = availableFeatures?.find(f => f.id === val);
                                if (meta?.type === FeatureType.BOOLEAN) form.setValue(`features.${index}.value`, "true");
                                if (meta?.type === FeatureType.NUMBER) form.setValue(`features.${index}.value`, "0");
                                if (meta?.type === FeatureType.LIST) form.setValue(`features.${index}.value`, "");
                              }}
                              value={field.value}
                            >
                              <FormControl><SelectTrigger><SelectValue placeholder="Pick Feature" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {availableFeatures?.map(f => (
                                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dynamic Value Input */}
                      <FormField
                        control={form.control}
                        name={`features.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-[3]">
                            <FormControl>
                              {featureMeta?.type === FeatureType.BOOLEAN ? (
                                <div className="flex items-center gap-3 h-10 px-3 border rounded-md bg-secondary/20">
                                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm flex-1">Enabled</span>
                                  <Switch
                                    checked={field.value === "true"}
                                    onCheckedChange={(val) => field.onChange(val.toString())}
                                  />
                                </div>
                              ) : featureMeta?.type === FeatureType.NUMBER ? (
                                <div className="relative">
                                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    className="pl-9"
                                    placeholder="Amount"
                                    {...field}
                                  />
                                </div>
                              ) : featureMeta?.type === FeatureType.LIST ? (
                                <div className="relative">
                                  <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    className="pl-9"
                                    placeholder="Option 1, Option 2, Option 3"
                                    {...field}
                                  />
                                </div>
                              ) : (
                                <Input placeholder="Select feature first" disabled />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                {fields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No features linked yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 animate-spin h-5 w-5" />}
              Create Plan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
