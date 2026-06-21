"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useOrgAccess } from "@/lib/hooks/use-org-access";

/**
 * Client-side gate for the Administration area. Renders children only for
 * owners / ADMINISTRATION_ACCESS holders; otherwise redirects to the org
 * root. The backend independently enforces every action, so this is UX-only.
 */
export function AdministrationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const orgId = params.orgId as string;

  const { canAdminister, isLoading } = useOrgAccess(orgId);

  useEffect(() => {
    if (!isLoading && !canAdminister) {
      router.replace(`/${lang}/organizations/${orgId}`);
    }
  }, [isLoading, canAdminister, router, lang, orgId]);

  if (isLoading || !canAdminister) return null;

  return <>{children}</>;
}
