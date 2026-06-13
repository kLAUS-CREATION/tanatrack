"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Warehouse, Users, ShieldCheck, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrgAccess } from "@/lib/hooks/use-org-access"

const baseItems = [
  { title: "Branches", slug: "branches", icon: Store },
  { title: "Warehouses", slug: "warehouses", icon: Warehouse },
  { title: "Members", slug: "members", icon: Users },
  { title: "Roles & Permissions", slug: "roles", icon: ShieldCheck },
]

export function AdministrationNav() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const orgId = segments[3]
  const current = segments[5] ?? ""

  const { isOwner } = useOrgAccess(orgId)

  // The Organization tab edits org-level settings — owner only.
  const items = isOwner
    ? [...baseItems, { title: "Organization", slug: "organization", icon: Building2 }]
    : baseItems

  return (
    <nav className="flex flex-wrap gap-1 border-b border-primary/40 dark:border-primary/20">
      {items.map((item) => {
        const active = current === item.slug
        const Icon = item.icon
        return (
          <Link
            key={item.slug}
            href={`/dashboard/${orgId}/administration/${item.slug}`}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
