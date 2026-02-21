
"use client"

import React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, AlertCircle, CheckCircle2, Mail, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { verifyEmailSchema } from "@/lib/validations/verify-email.validation"
import { useVerifyEmail, useResendVerificationEmail } from "@/lib/hooks/auth/useVerifyEmail"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type VerifyEmailFormValues = typeof verifyEmailSchema._type

export function VerifyEmail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const { mutate: verifyEmail, isPending } = useVerifyEmail()
  const { mutate: resendEmail, isPending: isResendPending } = useResendVerificationEmail()

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: "",
    },
  })

  function onSubmit(values: VerifyEmailFormValues) {
    setServerError(null)

    if (!email) {
      setServerError("Email address is missing. Please sign up again.")
      return
    }

    verifyEmail(
      { email, code: values.code },
      {
        onSuccess: () => {
          setIsSuccess(true)
          setTimeout(() => {
            router.push("/auth/sign-in")
          }, 2000)
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || "Verification code is invalid. Please try again."
          setServerError(message)
        },
      },
    )
  }

  function handleResendEmail() {
    if (!email) {
      setServerError("Email address is missing.")
      return
    }

    resendEmail(
      { email },
      {
        onSuccess: () => {
          setResendMessage("Verification code sent! Check your inbox.")
          setTimeout(() => setResendMessage(null), 4000)
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || "Failed to resend verification code."
          setServerError(message)
        },
      },
    )
  }

  if (isSuccess) {
    return (
      <div className="size-full flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full opacity-20 blur-xl"></div>
          <div className="relative flex items-center justify-center w-full h-full bg-background rounded-full border-2 border-primary">
            <CheckCircle2 className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
          <p className="text-foreground-tertiary">Your account is now active. Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="size-full">
      <div className="flex flex-col items-center justify-start space-y-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-center">Verify Your Email</h2>
        <p className="text-foreground-tertiary text-sm text-center">
          We sent a 6-digit code to <br />
          <span className="font-semibold text-foreground-secondary">{email || "your email"}</span>
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-x-3 border border-destructive/20 animate-in">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      {resendMessage && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm flex items-start gap-x-3 border border-green-500/20 animate-in">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{resendMessage}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    disabled={isPending}
                    placeholder="000000"
                    maxLength={6}
                    className="h-12 rounded-lg border-gray-300/30 text-center text-lg tracking-widest font-mono focus:border-primary focus:ring-primary transition"
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button variant="btn" type="submit" disabled={isPending} className="w-full h-11">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-center text-sm text-foreground-tertiary mb-4">Didn&apos;t receive the code?</p>
        <Button
          type="button"
          variant="outline"
          disabled={isResendPending || isPending}
          onClick={handleResendEmail}
          className="w-full h-11 bg-transparent"
        >
          {isResendPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Resend Code
            </>
          )}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-foreground-tertiary">
        Changed your email?{" "}
        <Link href="/auth/sign-up" className="text-foreground-secondary font-semibold hover:underline">
          Sign up again
        </Link>
      </p>
    </div>
  )
}
