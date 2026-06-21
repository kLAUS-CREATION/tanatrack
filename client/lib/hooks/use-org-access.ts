"use client";

import {
  useGetMyAccessQuery,
  OrganizationRole,
} from "@/lib/features/services/membership.api";

const ADMINISTRATION_ACCESS = "ADMINISTRATION_ACCESS";

/**
 * The current user's access for an organization.
 * - `isOwner`: the org owner (unconditional super-user).
 * - `canAdminister`: owner OR holder of the ADMINISTRATION_ACCESS permission —
 *   gates visibility of the Administration area.
 */
export function useOrgAccess(orgId?: string) {
  const { data, isLoading, isFetching } = useGetMyAccessQuery(orgId as string, {
    skip: !orgId,
  });

  const isOwner = data?.roleType === OrganizationRole.OWNER;
  const canAdminister =
    isOwner || !!data?.permissions.includes(ADMINISTRATION_ACCESS);

  return {
    isOwner,
    canAdminister,
    permissions: data?.permissions ?? [],
    isLoading: isLoading || isFetching,
  };
}
