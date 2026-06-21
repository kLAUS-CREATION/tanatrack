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
  Contact,
  ShoppingCart,
  ShoppingBag,
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
import { useGetSellableBranchesQuery } from "@/lib/features/services/sales.api"
import { useOrgAccess } from "@/lib/hooks/use-org-access"

type DashboardLink = {
  title: string;
  link: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  // Owner/admin always see the link; otherwise it requires this permission slug.
  permission?: string;
  // Visible only when the user may sell at >=1 branch (SALES_CREATE, incl. branch-scoped).
  sellGated?: boolean;
}

const dashboardLinks: DashboardLink[] = [
  { title: "Dashboard", link: "", icon: LayoutDashboard },
  { title: "Branches", link: "branches", icon: Store },
  { title: "Warehouses", link: "warehouses", icon: Warehouse },
  { title: "Products", link: "products", icon: Package },
  { title: "Inventory", link: "inventory", icon: Boxes, permission: "INVENTORY_VIEW_GLOBAL_STOCK" },
  { title: "Suppliers", link: "suppliers", icon: Truck },
  { title: "Customers", link: "customers", icon: Users },
  { title: "Employees", link: "employees", icon: Contact },
  { title: "Purchases", link: "purchases", icon: ShoppingCart },
  // Action entry: gated on being able to sell somewhere (see sellGated filter below).
  { title: "New Sale", link: "new-sale", icon: ShoppingBag, sellGated: true },
  { title: "Sales", link: "sales", icon: Receipt },
  { title: "Reports", link: "reports", icon: BarChart3 },
  { title: "AI Chat", link: "ai", icon: Sparkles },
  // Visible only to owners / administration-permission holders (filtered below).
  { title: "Administration", link: "administration", icon: ShieldCheck, adminOnly: true },
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading: isUserLoading } = useGetSessionQuery();

  // orgId lives at /<lang>/organizations/<orgId>/...
  const pathname = usePathname();
  const orgId = pathname.split("/")[3];
  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);

  // Branches the user may sell at (owner, global SALES_CREATE, or branch-scoped role).
  // Drives visibility of the "New Sale" entry — branch-scoped sellers won't have
  // SALES_CREATE in the global `permissions` array, so we gate on this list instead.
  const { data: sellableBranches } = useGetSellableBranchesQuery(orgId);
  const canSell = (sellableBranches?.length ?? 0) > 0;

  const links = dashboardLinks.filter((l) => {
    if (l.adminOnly && !canAdminister) return false;
    if (l.sellGated && !canSell) return false;
    if (l.permission && !(isOwner || canAdminister || permissions.includes(l.permission)))
      return false;
    return true;
  });

  if (!user && !isUserLoading) return null;

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props} className="bg-sidebar border-r border-sidebar-border/50">
      <SidebarHeader className="h-16 border-b border-sidebar-border/50 px-4 flex justify-center bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
        <OrganizationSwitcher />
      </SidebarHeader>

      <SidebarContent className="py-2 scrollbar-thin">
        <NavMain items={links} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3 bg-sidebar/50 backdrop-blur-sm">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )

}
