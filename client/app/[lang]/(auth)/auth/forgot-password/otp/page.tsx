"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { verifyEmailSchema, VerifyEmailForm } from "@/lib/validations/verify-email.validation";
import { useCheckVerificationOtpMutation } from "@/lib/features/services/auth.api";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/shared/section-heading";

export default function ForgotPasswordOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => searchParams.get("email"), [searchParams]);

  const [checkOtp, { isLoading }] = useCheckVerificationOtpMutation();

  const form = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: VerifyEmailForm) {
    if (!email) return;
    try {
      // type: "forget-password" matches your OtpType definition in authApi
      await checkOtp({ email, otp: values.code, type: "forget-password" }).unwrap();

      const params = new URLSearchParams();
      params.set("email", email);
      params.set("otp", values.code);
      router.push(`/auth/reset-password?${params.toString()}`);
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Invalid or expired code.");
      form.setError("code", { message: "Invalid code" });
    }
  }

  if (!email) return null;

  return (
    <div className="w-full min-h-screen max-w-lg mx-auto py-12 text-center space-y-8 flex flex-col items-center justify-center gap-4 lg:gap-6">
      <SectionHeading title1="Verify Your" title2={"Identity"} desc={`Enter the code sent to ${email} `} center={true} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center">
                <FormControl>
                  <InputOTP maxLength={6} {...field} onComplete={() => form.handleSubmit(onSubmit)()}>
                    <InputOTPGroup className="space-x-1 lg:space-x-2">
                      {[0, 1, 2].map((i) => <InputOTPSlot key={i} index={i} className="h-14 w-12 text-lg" />)}
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup className="space-x-1 lg:space-x-2">
                      {[3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} className="h-14 w-12 text-lg" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-12" disabled={isLoading || form.watch("code").length !== 6}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Verify Code"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
