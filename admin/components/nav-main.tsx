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

type NavItem = {
  title: string;
  link: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="px-2">
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const isActive = pathname === item.link
          const Icon = item.icon

          // Disabled (backend not ready): render a non-interactive "Soon" row.
          if (item.disabled) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  disabled
                  className="group/nav relative h-10 w-full cursor-not-allowed justify-start gap-3 px-3 text-sm font-medium text-muted-foreground/60"
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.title}</span>
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

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
                <Link href={item.link}>
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-all duration-200",
                      isActive
                        ? "text-primary scale-110"
                        : "text-muted-foreground group-hover/nav:text-foreground group-hover/nav:scale-105",
                    )}
                  />
                  <span
                    className={cn(
                      "transition-transform duration-200",
                      isActive ? "translate-x-0.5" : "",
                    )}
                  >
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary animate-in fade-in duration-300" />
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
