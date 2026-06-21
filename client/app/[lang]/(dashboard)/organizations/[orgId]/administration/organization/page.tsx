"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { OrganizationForm } from "@/components/dashboard/administration/organization-form";
import { useOrgAccess } from "@/lib/hooks/use-org-access";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const orgId = params.orgId as string;

  const { isOwner, isLoading } = useOrgAccess(orgId);

  // Org-level settings are owner-only; admins are bounced back to the first tab.
  useEffect(() => {
    if (!isLoading && !isOwner) {
      router.replace(`/${lang}/organizations/${orgId}/administration/branches`);
    }
  }, [isLoading, isOwner, router, lang, orgId]);

  if (isLoading || !isOwner) return null;

  return <OrganizationForm />;
}
