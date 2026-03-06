"use client"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { IAdminSidebarLinks } from "@/components/app-sidebar"
import Link from "next/link"

export function NavMain( { items } : { items: IAdminSidebarLinks[]}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
            <SidebarMenuItem className="p-3 w-full" key={item.link}>
              <Link href={item.link} className="size-full text-foreground-tertiary"> { item.title } </Link>
            </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
