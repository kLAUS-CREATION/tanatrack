"use client"

import { useSearchParams } from "next/navigation"
import { VerifyEmailWaiting } from "@/components/auth/verify-email-waiting"
import { useSession } from "@/lib/hooks/auth/useGetSession"

export default function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email")
  const { data: session } = useSession()


  return <VerifyEmailWaiting email={emailFromUrl || session?.user?.email || "your email"} />
}
