"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  verifyEmailSchema,
  VerifyEmailForm,
} from "@/lib/validations/verify-email.validation";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  useSendVerificationOtpMutation,
  useVerifyEmailOtpMutation,
} from "@/lib/features/services/auth.api";
import SectionHeading from "../shared/section-heading";

interface ApiError {
  data?: { message?: string };
}

export function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // 1. Get email from Search Params
  const email = useMemo(() => searchParams.get("email"), [searchParams]);

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyEmailOtpMutation();
  const [sendOtp, { isLoading: isSending }] = useSendVerificationOtpMutation();

  const form = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "" },
  });

  // 2. Immediate Security Check: Redirect if no email is present
  useEffect(() => {
    if (!email) {
      router.replace("/auth/sign-up");
      toast.error("Please sign up to verify your email.");
    }
  }, [email, router]);

  // 3. Resend Timer Logic
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const onResendCode = async () => {
    if (!email || resendCountdown > 0) return;
    try {
      await sendOtp({ email, type: "email-verification" }).unwrap();
      setResendCountdown(60);
      toast.success("A new 6-digit code has been sent.");
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Failed to resend code.");
    }
  };

  async function onSubmit(values: VerifyEmailForm) {
    if (!email) return;

    try {
      await verifyOtp({ email, otp: values.code }).unwrap();
      setIsSuccess(true);
      toast.success("Account verified successfully!");

      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2500);
    } catch (error) {
      const err = error as ApiError;
      const message = err.data?.message || "Invalid or expired code.";
      form.setError("code", { message });
      toast.error(message);
    }
  }

  if (!email) return null;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-background border-2 border-green-500 rounded-full p-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Email Verified!</h2>
          <p className="text-muted-foreground">Redirecting you to sign in...</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto py-12 min-h-screen animate-in fade-in slide-in-from-bottom-4 flex flex-col justify-center gap-4 lg:gap-6">
      <SectionHeading
        title1="Verify Your"
        title2={"Email"}
        desc={`Enter the 6-digit code we sent to ${email}`}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center text-center">
                <FormLabel className="sr-only">OTP Code</FormLabel>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    disabled={isVerifying}
                    {...field}
                    onComplete={() => form.handleSubmit(onSubmit)()}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-12 h-14 text-lg border-2"
                        />
                      ))}
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup className="gap-2">
                      {[3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-12 h-14 text-lg border-2"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full font-semibold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            disabled={isVerifying || form.watch("code").length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Confirm Code"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-10 flex flex-col items-center space-y-6">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">
            Didn&apos;t receive the code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResendCode}
            disabled={resendCountdown > 0 || isSending}
            className="group"
          >
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw
                className={`mr-2 h-4 w-4 transition-transform group-hover:rotate-180 ${resendCountdown > 0 ? "opacity-50" : ""}`}
              />
            )}
            <span className="tabular-nums">
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : "Resend code"}
            </span>
          </Button>
        </div>

        <Link
          href="/auth/sign-up"
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to sign up
        </Link>
      </div>
    </div>
  );
}
