"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ChevronRight, Loader2  } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { forgotPasswordSchema, ForgotPasswordForm } from "@/lib/validations/forgot-password.validation";
import { useRequestPasswordResetOtpMutation } from "@/lib/features/services/auth.api";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import SectionHeading from "../shared/section-heading";

export function ForgotPassword() {
  const router = useRouter();
  const [requestOtp, { isLoading }] = useRequestPasswordResetOtpMutation();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordForm) {
    try {
      await requestOtp({ email: values.email }).unwrap();
      toast.success("Reset code sent to your email.");

      const params = new URLSearchParams();
      params.set("email", values.email);
      router.push(`/auth/forgot-password/otp?${params.toString()}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send reset code.");
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto py-12 min-h-screen animate-in fade-in slide-in-from-bottom-4 flex flex-col justify-center gap-4 lg:gap-6">
      <SectionHeading title1="Forgot" title2={"Password"} desc={"Enter your email to receive a 6-digit reset code."} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input {...field} placeholder="name@example.com" className="pl-10 h-12" disabled={isLoading} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Code"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
