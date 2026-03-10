"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"
import { Session } from "@/lib/auth-client"

type AuthContextType = {
    session: ReturnType<Session>["data"]
    isLoading: boolean
    error: ReturnType<Session>["error"]
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isLoading, error } = useGetSessionQuery()
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        if (isLoading) return;

        // Additional Client-Side Safety Net Redirects
        const isAuthRoute = pathname.includes('/auth')
        const isDashboardRoute = pathname.includes('/dashboard') || pathname.includes('/organizations')
        const isNewOrgPage = pathname.includes('/organizations/new')

        if (isDashboardRoute && !session) {
            router.push('/auth/sign-in')
        } else if (isAuthRoute && session) {
            router.push('/organizations')
        } else if (isNewOrgPage && !session) {
            router.push('/auth/sign-in?redirect=/organizations/new')
        }
    }, [session, isLoading, pathname, router])

    return (
        <AuthContext.Provider value={{ session, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
