"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

type NavItem = { title: string; link: string; icon: LucideIcon }

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  // pathname looks like /<lang>/organizations/<orgId>/<section>/...
  const segments = pathname.split("/")
  const lang = segments[1]
  const orgId = segments[3]
  const section = segments[4] ?? "" // "" while on the dashboard root

  return (
    <SidebarGroup className="px-2">
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const isActive = section === item.link
          const href = item.link ? `/${lang}/organizations/${orgId}/${item.link}` : `/${lang}/organizations/${orgId}`
          const Icon = item.icon

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  "group/nav relative h-10 w-full justify-start gap-3 px-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Link href={href}>
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-all duration-200",
                      isActive ? "text-primary scale-110" : "text-muted-foreground group-hover/nav:text-foreground group-hover/nav:scale-105",
                    )}
                  />
                  <span className={cn(
                    "transition-transform duration-200",
                    isActive ? "translate-x-0.5" : ""
                  )}>{item.title}</span>
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary animate-in fade-in duration-300"
                    />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )


}
