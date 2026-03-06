import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus, Trash2, Rocket, Info, CreditCard,
  Loader2, CheckCircle2, Globe, Settings2, ListPlus
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";

// API Hooks & Types
import { useCreatePlanMutation } from "@/lib/features/services/plans.api";
import { useGetFeaturesQuery } from "@/lib/features/services/feature.api";
import { PlanType } from "@/types/plans";

// --- VALIDATION SCHEMA ---
const planSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphens only"),
  type: z.nativeEnum(PlanType),
  tagline: z.string().optional(),
  description: z.string().optional(),
  badge: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  currency: z.string().min(3).max(3).default("USD"),
  monthlyPrice: z.coerce.number().min(0),
  yearlyPrice: z.coerce.number().min(0),
  trialDays: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  // Nested Features Array
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
      currency: "USD", monthlyPrice: 0, yearlyPrice: 0,
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
      toast.success("Subscription plan created and deployed!");
      form.reset();
      onSuccess();
    } catch (e) {
      toast.error("Failed to create plan. Please check your inputs.");
    }
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* SECTION 1: GENERAL INFO */}
          <div className="flex flex-col gap-2 lg:gap-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> General Identity
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Define the name, unique URL slug, and visibility settings for this tier.
              </p>
            </div>

            <div className="md:col-span-2 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl><Input placeholder="Enterprise Pro" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl><Input placeholder="enterprise-pro" {...field} /></FormControl>
                    <FormDescription>Unique identifier in URLs</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={PlanType.FREE}>Free Tier</SelectItem>
                        <SelectItem value={PlanType.PRO}>Paid Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="badge" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visual Badge</FormLabel>
                    <FormControl><Input placeholder="Best Value" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="tagline" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl><Input placeholder="Perfect for growing teams" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          <Separator />

          {/* SECTION 2: PRICING & LOGIC */}
          <div className="flex flex-col gap-2 lg:gap-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Pricing & Logic
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set your currency, billing amounts, and trial periods.
              </p>
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

              <div className="flex  gap-4 items-center">
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isPublic" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel>Publicly Visible</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          <Separator />

          {/* SECTION 3: FEATURE BUNDLE (DYNAMIC) */}
          <div className="flex flex-col gap-2 lg:gap-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ListPlus className="h-5 w-5 text-primary" /> Feature Bundle
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select and configure the specific limits and capabilities for this plan.
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ featureId: "", value: "", overrideDescription: "" })}
                  className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" /> Link Feature
                </Button>
              </div>

              <div className="grid gap-3 rounded-xs">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start p-4 bg-card border rounded-xl animate-in slide-in-from-top-2">
                    <FormField
                      control={form.control}
                      name={`features.${index}.featureId`}
                      render={({ field }) => (
                        <FormItem className="flex-[3]">
                          <Select onValueChange={field.onChange} value={field.value}>
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

                    <FormField
                      control={form.control}
                      name={`features.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-[2]">
                          <FormControl><Input placeholder="Value (e.g. 50)" {...field} /></FormControl>
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
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-12">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No features linked yet. Start building your plan tier.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button type="submit" size="lg" className="mr-4 lg:mr-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 animate-spin h-5 w-5" /> : <Rocket className="mr-2 h-5 w-5" />}
              New Plan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
