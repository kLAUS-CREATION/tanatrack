"use client"

import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useGetOrganizationByIdQuery, useGetOrganizationsQuery } from "@/lib/features/services/organization.api"

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar()
  const { dashboardId } = useParams();

  if (!dashboardId) {
      throw new Error("Cant get the dashboard Id");
  }

  const { data: organization, isLoading} = useGetOrganizationByIdQuery(dashboardId as string);
  const router = useRouter();

  if (!organization && !isLoading) {
      // console.log("this is organization: ", organization);
      router.push(`/organizations/${dashboardId}`)
  }

  const { data: organizations, isLoading: isLoadingOrganizations} = useGetOrganizationsQuery();
  if (!organizations && !isLoadingOrganizations) {
      throw new Error("Cant get the organization for the user");
  }


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-normal text-foreground">{organization?.name}</span>
                <span className="truncate text-xs">{organization?.subscription?.plan?.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations && organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="gap-2 p-2"
              >
               <Link href={`/dashboard/${org.id}`} className="w-full flex items-center gap-2">
                   {org.name}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <Link href={`/dashboard/new-organization`} className="flex items-center gap-2 size-full">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">New Organization</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
