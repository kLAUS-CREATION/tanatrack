"use client"

import { useEffect, useState } from "react"
import { Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import Link from "next/link"
import { useResendVerificationEmail } from "@/lib/hooks/auth/useVerifyEmail"

interface VerifyEmailWaitingProps {
  email: string
}

export function VerifyEmailWaiting({ email }: VerifyEmailWaitingProps) {
  const [resendTimer, setResendTimer] = useState(0)
  const [resendAttempts, setResendAttempts] = useState(0)
  const { mutate: resendEmail, isPending } = useResendVerificationEmail()

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  const handleResendEmail = () => {
    if (resendAttempts >= 3) {
      toast.error("Too many resend attempts. Please try again later.")
      return
    }

    resendEmail(
      { email },
      {
        onSuccess: () => {
          setResendTimer(60)
          setResendAttempts((prev) => prev + 1)
        },
      },
    )
  }

  const canResend = resendTimer === 0 && resendAttempts < 3

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="container mx-auto max-w-md">
        {/* Main Content */}
        <div className="text-center">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Seenaa
            </h1>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground-secondary">
              You&apos;re ready to go!
            </h2>
          </div>
          <div className="mb-8">
            <p className="text-gray-700 dark:text-gray-300 mb-1">
              Please check your email and click the verification link to complete your sign up.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-2">

            </p>
          </div>

          {/* Open Email Button */}
          <div className="mb-8">
            <Button
              variant={"btn"}
              onClick={() => window.open("https://mail.google.com", "_blank")}
              className=""
            >
              <Mail className="w-4 h-4 mr-2" />
              Open Email
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Resend Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Didn&apos;t receive the email?
            </p>

            {resendAttempts >= 3 ? (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Too many attempts. Please try again later.
              </p>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={!canResend || isPending}
                className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  "Sending..."
                ) : canResend ? (
                  "Resend verification email"
                ) : (
                  `Resend in ${resendTimer}s`
                )}
              </button>
            )}
          </div>

          {/* Optional: Back to login link */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/auth/sign-in"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
