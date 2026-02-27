"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { resetPasswordSchema, ResetPasswordForm } from "@/lib/validations/forgot-password.validation";
import { useResetPasswordOtpMutation } from "@/lib/features/services/auth.api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionHeading from "../shared/section-heading";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => searchParams.get("email"), [searchParams]);
  const otp = useMemo(() => searchParams.get("otp"), [searchParams]);

  const [resetPass, { isLoading }] = useResetPasswordOtpMutation();

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", passwordConfirm: "" },
  });

  async function onSubmit(values: ResetPasswordForm) {
    if (!email || !otp) return;
    try {
      await resetPass({ email, otp, password: values.password }).unwrap();
      toast.success("Password updated! You can now sign in.");
      router.push("/auth/sign-in");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update password.");
    }
  }

  if (!email || !otp) return null;

  return (
    <div className="w-full max-w-lg mx-auto py-12 min-h-screen animate-in fade-in slide-in-from-bottom-4 flex flex-col justify-center gap-4 lg:gap-6">
      <SectionHeading title1="Set New" title2={"Password"} desc={"Secure your account with a new password."} center={true} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...field} type="password" placeholder="••••••••" className="pl-10 h-12" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...field} type="password" placeholder="••••••••" className="pl-10 h-12" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
