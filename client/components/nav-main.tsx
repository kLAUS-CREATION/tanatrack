"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function NavMain({ items }: { items: { title: string, link: string }[] }) {
  const pathname = usePathname()
  const orgId = pathname.split("/")[3];

  return (
    <SidebarGroup className="px-2">
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive = pathname === item.link

          return (
            <SidebarMenuItem key={item.link}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  "relative h-8 w-full justify-start rounded-md px-3 transition-colors",
                  "text-xs font-medium uppercase tracking-wider",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Link href={`/dashboard/${orgId}/${item.link}`}>
                  <span>{item.title}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
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
