"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Store,
  Warehouse,
  Package,
  Boxes,
  Truck,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react"
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
import { useOrgAccess } from "@/lib/hooks/use-org-access"

type DashboardLink = { title: string; link: string; icon: LucideIcon; adminOnly?: boolean }

const dashboardLinks: DashboardLink[] = [
  { title: "Dashboard", link: "", icon: LayoutDashboard },
  { title: "Branches", link: "branches", icon: Store },
  { title: "Warehouses", link: "warehouses", icon: Warehouse },
  { title: "Products", link: "products", icon: Package },
  { title: "Inventory", link: "inventory", icon: Boxes },
  { title: "Suppliers", link: "suppliers", icon: Truck },
  { title: "Customers", link: "customers", icon: Users },
  { title: "Purchases", link: "purchases", icon: ShoppingCart },
  { title: "Sales", link: "sales", icon: Receipt },
  { title: "Reports", link: "reports", icon: BarChart3 },
  { title: "AI Chat", link: "ai", icon: Sparkles },
  // Visible only to owners / administration-permission holders (filtered below).
  { title: "Administration", link: "administration", icon: ShieldCheck, adminOnly: true },
  { title: "Help", link: "help", icon: LifeBuoy },
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading: isUserLoading } = useGetSessionQuery();

  // orgId lives at /<lang>/dashboard/<orgId>/...
  const pathname = usePathname();
  const orgId = pathname.split("/")[3];
  const { canAdminister } = useOrgAccess(orgId);

  const links = dashboardLinks.filter((l) => !l.adminOnly || canAdminister);

  if (!user && !isUserLoading) return null;

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props} className="bg-background2">
      <SidebarHeader className="h-14 border-b border-sidebar-border/40 px-4 flex justify-center">
        <OrganizationSwitcher />
      </SidebarHeader>

      <SidebarContent className="py-4">
        <NavMain items={links} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
