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
  // pathname looks like /<lang>/dashboard/<orgId>/<section>/...
  const segments = pathname.split("/")
  const orgId = segments[3]
  const section = segments[4] ?? "" // "" while on the dashboard root

  return (
    <SidebarGroup className="px-2">
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive = section === item.link
          const href = item.link ? `/dashboard/${orgId}/${item.link}` : `/dashboard/${orgId}`
          const Icon = item.icon

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  "group/nav relative h-9 w-full justify-start gap-3 rounded-md pl-4 pr-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Link href={href}>
                  {/* Active accent bar */}
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground",
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
