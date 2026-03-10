"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { OrganizationSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"

const dashboardLinks = [
  { title: "Dashboard", link: "/" },
  { title: "Products", link: "/products" },
  { title: "Inventory", link: "/inventory" },
  { title: "Suppliers", link: "/suppliers" },
  { title: "Customers", link: "/customers" },
  { title: "Purchases", link: "/purchases" },
  { title: "Sales", link: "/sales" },
  { title: "Warehouses", link: "/warehouses" },
  { title: "Reports", link: "/reports" },
  { title: "AI Chat", link: "/ai" },
  { title: "Settings", link: "/settings" },
  { title: "Help", link: "/help" },
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading: isUserLoading } = useGetSessionQuery();

  if (!user && !isUserLoading) return null;

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" {...props}>
      <SidebarHeader className="h-14 border-b border-sidebar-border/40 px-4 flex justify-center">
        <OrganizationSwitcher />
      </SidebarHeader>

      <SidebarContent className="py-4">
        <NavMain items={dashboardLinks} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
