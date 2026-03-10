import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrgSchema } from "@/lib/validations/organization.validation";
import { useCreateOrganizationMutation } from "@/lib/features/services/organization.api";
import { BillingInterval } from "@/types/organization";
import { toast } from "sonner";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Loader2} from "lucide-react";

export default function OrganizationCreationForm({ selectedPlanId , planInterval }: { selectedPlanId: string, planInterval: BillingInterval }) {
  const [createOrg, { isLoading }] = useCreateOrganizationMutation();

  const form = useForm({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      planId: "",
      billingInterval: planInterval,
    },
  });

  // Sync planId from parent selection to form state
  React.useEffect(() => {
    form.setValue("planId", selectedPlanId, { shouldValidate: true });
  }, [selectedPlanId, form]);

  async function onSubmit(values: any) {
    try {
      await createOrg(values).unwrap();
      toast.success("Organization created successfully!");

    } catch (err) {
      toast.error("Could not create organization");
    }
  }

  return (
    <section className="w-full lg:w-[30%] border-r pr-8 border-border/50">
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Organization Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter business name" className="pl-10 h-12" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>This will be your workspace name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!selectedPlanId && form.formState.isSubmitted && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4" /> Please select a plan from the list.
              </div>
            )}

            <Button
              type="submit"
              className=""
              disabled={isLoading || !selectedPlanId}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Create Organization
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
