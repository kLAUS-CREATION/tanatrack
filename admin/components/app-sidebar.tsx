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
  return (
    <Sidebar collapsible="offcanvas" {...props} className="bg-background2">
      <SidebarHeader>
        <AdminDashboardHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminSidebarLinks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
