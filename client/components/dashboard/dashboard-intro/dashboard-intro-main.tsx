"use client"

import { useGetSessionQuery } from "@/lib/features/services/auth.api";

export default function DashboardIntroMain() {
    const { data: session } = useGetSessionQuery();

    const user = session?.user;
    return <main className="container mx-auto h-[90%] overflow-y-auto">

        Welcome Back { user?.name || "Unknown"}
    </main>
}
