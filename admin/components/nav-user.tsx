"use client"

import { ChevronsUpDown } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LogoutButton } from "./auth/logout-button"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"

/** Two-letter initials from a display name, for the avatar fallback. */
function initials(name?: string | null) {
  if (!name) return "AD"
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data, isLoading } = useGetSessionQuery()

  if (isLoading) return null

  const user = data?.user

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.image || undefined} alt={user?.name || "Admin"} />
                <AvatarFallback className="rounded-lg uppercase">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name || "Admin"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || "—"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "Admin"} />
                  <AvatarFallback className="rounded-lg uppercase">
                    {initials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name || "Admin"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || "—"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-1">
              <LogoutButton variant="ghost" className="w-full justify-start" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
