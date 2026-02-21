"use client"

import React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

import { forgotPasswordSchema } from "@/lib/validations/forgot-password.validation"
import { useForgotPassword } from "@/lib/hooks/auth/useForgotPassword"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type ForgotPasswordFormValues = typeof forgotPasswordSchema._type

export function ForgotPassword() {
  const router = useRouter()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const { mutate: forgotPassword, isPending } = useForgotPassword()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: ForgotPasswordFormValues) {
    forgotPassword(
      { email: values.email },
      {
        onSuccess: () => {
          setIsSubmitted(true)
          setSubmittedEmail(values.email)
          form.reset()
        },
      },
    )
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto max-w-md">

        <div className="text-center">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Seenaa
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We sent a password reset link to:
            </p>
          </div>

          {/* Email Display */}
          <div className="mb-8">
            <p className="font-medium text-blue-600 dark:text-blue-500 break-all mb-4">
              {submittedEmail}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Click the link in the email to reset your password.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Link expires in 1 hour.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-8">
            <Button
              onClick={() => window.open("https://mail.google.com", "_blank")}
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-md"
            >
              <Mail className="w-4 h-4 mr-2" />
              Open Email
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Back Links */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Try different email
              </button>
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-md pt-10">

      <div className="text-center">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Seenaa
          </h1>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Reset your password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="text-left space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled={isPending}
                      placeholder="you@example.com"
                      className="h-12 rounded-md border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
            variant={'btn'}
            onClick={() => router.push("/auth/sign-in")}
            className="w-full rounded-none"
          >
            Send Reset Link
          </Button>
          </form>
        </Form>

        {/* Back Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => router.push("/auth/sign-in")}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
