import HomeLayout from "@/components/layouts/home-layout"
import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
    return <HomeLayout>
        {children}
    </HomeLayout>

}