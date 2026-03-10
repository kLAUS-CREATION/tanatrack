"use client"

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { OrganizationRole, useInviteMemberMutation, useGetOrgRolesQuery } from "@/lib/features/services/membership.api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email(),
  roleType: z.nativeEnum(OrganizationRole),
  roleId: z.string().optional(),
});

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const { data: roles } = useGetOrgRolesQuery(organizationId);
  const [invite] = useInviteMemberMutation();

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", roleType: OrganizationRole.ADMIN }
  });

  const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
    try {
      await invite({ organizationId, body: values }).unwrap();
      toast.success("Invitation sent to " + values.email);
      form.reset();
    } catch (e: any) {
      toast.error(e.data?.message || "Failed to send invitation");
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <h3 className="text-xl tarcking-[1px]">Invite New Member</h3>
        <p>Collaborate with your team by inviting them to this organization.</p>
      </div>
      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-end">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-3 w-full">
                  <FormLabel className="text-foreground-secondary">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="name@company.com" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem className="flex-2 w-full">
                  <FormLabel>Initial Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {roles?.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg">
               Send
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
