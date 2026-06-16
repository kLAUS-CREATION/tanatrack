"use client"

import { RolePermissionsManager } from "@/components/dashboard/membership/role-permission-manager";
import { usePathname } from "next/navigation";

export default function Page() {
  const pathname = usePathname();
  const orgId = pathname.split("/")[3];

  return <RolePermissionsManager organizationId={orgId} />;
}
