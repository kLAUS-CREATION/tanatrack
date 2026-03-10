"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AdminDashboardHeader } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Logo from "./shared/logo"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"

const user =  {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
}

export interface IAdminSidebarLinks {
    title: string;
    link: string;
}

const adminSidebarLinks: IAdminSidebarLinks[] = [
    {
        title: "Dashboard",
        link: "/"
    },
    {
        title: "Customers",
        link: "/customers"
    },
    {
        title: "Plans",
        link: "/plans"
    },
    {
        title:  "Features",
        link: "/features"
    },
    {
        title: "Subscription",
        link: "/subscriptions"
    },
    {
        title: "Settings",
        link: "/settings"
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading: isUserLoading } = useGetSessionQuery();

  if (!user && !isUserLoading) return null;

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" {...props}>
      <SidebarHeader className="h-14 border-b border-sidebar-border/40 px-4 flex justify-center">
        <Logo />
      </SidebarHeader>

      <SidebarContent className="py-4">
        <NavMain items={adminSidebarLinks} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
