"use client"

import { useEffect } from "react"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface VerifyEmailSuccessProps {
  email?: string
}

export function VerifyEmailSuccess({ email }: VerifyEmailSuccessProps) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-green-500/20 via-transparent to-emerald-500/20 opacity-40 blur-3xl" />

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg p-4 rounded-full border border-green-500/30 animate-bounce">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">Email Verified!</h1>
            <p className="text-sm text-foreground/60 mt-2">Your account is now active and ready to use</p>
            {email && <p className="text-xs text-foreground/40 mt-1 break-all">{email}</p>}
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              Welcome! You can now access all features of our community.
            </p>
          </div>

          {/* Auto Redirect Message */}
          <div className="text-sm text-foreground/60">Redirecting you to your dashboard in a few seconds...</div>

          {/* Continue Button */}
          <Button
            onClick={() => router.push("/home")}
            className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg transition-all duration-300 group text-white"
          >
            Go To Home
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}
