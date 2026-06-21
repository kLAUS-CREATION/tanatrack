"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  CreditCard,
  LayoutGrid,
  Users,
  Receipt,
  Settings,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Logo from "./shared/logo"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"

export interface IAdminSidebarLink {
  title: string;
  link: string;
  icon: LucideIcon;
  /** Routes whose backend isn't built yet — shown as a disabled "Soon" entry. */
  disabled?: boolean;
}

const adminSidebarLinks: IAdminSidebarLink[] = [
  { title: "Dashboard", link: "/", icon: LayoutDashboard },
  { title: "Plans", link: "/plans", icon: CreditCard },
  { title: "Features", link: "/features", icon: LayoutGrid },
  { title: "Customers", link: "/customers", icon: Users, disabled: true },
  { title: "Subscriptions", link: "/subscriptions", icon: Receipt, disabled: true },
  { title: "Settings", link: "/settings", icon: Settings, disabled: true },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading: isUserLoading } = useGetSessionQuery();

  if (!user && !isUserLoading) return null;

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="inset"
      {...props}
      className="bg-sidebar border-r border-sidebar-border/50"
    >
      <SidebarHeader className="h-16 border-b border-sidebar-border/50 px-4 flex justify-center bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
        <Logo />
      </SidebarHeader>

      <SidebarContent className="py-2">
        <NavMain items={adminSidebarLinks} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3 bg-sidebar/50 backdrop-blur-sm">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
