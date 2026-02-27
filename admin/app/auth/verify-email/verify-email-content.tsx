"use client"

import { useSearchParams } from "next/navigation"
import { VerifyEmailWaiting } from "@/components/auth/verify-email-waiting"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"

export default function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email")
  const { data: session } = useGetSessionQuery()


  return <VerifyEmailWaiting email={emailFromUrl || session?.user?.email || "your email"} />
}
