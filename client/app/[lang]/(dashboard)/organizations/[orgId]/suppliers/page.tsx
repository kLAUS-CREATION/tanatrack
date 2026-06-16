"use client";

import { SuppliersManager } from "@/components/dashboard/suppliers/suppliers-manager";

export default function SuppliersPage() {
  // Single home for suppliers: read-only for everyone, with management controls
  // shown to SUPPLIERS_MANAGE holders / admins. Approvals live under Administration.
  return <SuppliersManager />;
}
