"use client";

import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { resetPasswordSchema } from "@/lib/validations/forgot-password.validation";
import { useResetPassword } from "@/lib/hooks/auth/useForgotPassword";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type ResetPasswordFormValues = typeof resetPasswordSchema._type;

export function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutate: resetPassword, isPending } = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);

    if (!token) {
      setServerError(
        "Invalid or expired reset link. Please request a new one.",
      );
      return;
    }

    resetPassword(
      { token, password: values.password },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 2000);
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message ||
            "Failed to reset password. Please try again or request a new link.";
          setServerError(message);
        },
      },
    );
  }

  if (isSuccess) {
    return (
      <div className="size-full flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-linear-to-r from-primary to-secondary rounded-full opacity-20 blur-xl"></div>
          <div className="relative flex items-center justify-center w-full h-full bg-background rounded-full border-2 border-primary">
            <CheckCircle2 className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">
            Password Reset Successful!
          </h2>
          <p className="text-foreground-tertiary">
            Your password has been updated. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full">
      <div className="flex flex-col items-center justify-start space-y-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-center">Create New Password</h2>
        <p className="text-foreground-tertiary text-sm text-center">
          Enter a strong password to secure your account
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-x-3 border border-destructive/20 animate-in">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

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
                    <Input
                      {...field}
                      disabled={isPending}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pr-10 rounded-lg border-gray-300/30 focus:border-primary focus:ring-primary transition"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
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
                    <Input
                      {...field}
                      disabled={isPending}
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pr-10 rounded-lg border-gray-300/30 focus:border-primary focus:ring-primary transition"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                      <span className="sr-only">
                        {showPasswordConfirm
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            variant="btn"
            type="submit"
            disabled={isPending}
            className="w-full h-11"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-foreground-tertiary">
        <Link
          href="/auth/sign-in"
          className="text-foreground-secondary font-semibold hover:underline"
        >
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
