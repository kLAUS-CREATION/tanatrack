import { apiSlice } from "../api";

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
}

/**
 * Whether a role grants org-wide (GLOBAL) or per-location (LOCAL) permissions.
 * A role's kind is fixed at creation and constrains which permissions it may hold.
 */
export enum RoleKind {
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
}

export interface IPermissionDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  action: string;
  scope: PermissionScope;
}

export interface IPermissionCategory {
  category: string;
  permissions: IPermissionDefinition[];
}

export interface IRole {
  id: string;
  name: string;
  kind: RoleKind;
  organizationId: string;
  permissions?: {
    permissionDefinitionId: string;
    allowed: boolean;
  }[];
  _count?: {
    memberships: number;
  };
}

export interface InviteLocationInput {
  branchId?: string;
  warehouseId?: string;
}

export interface InviteMemberRequest {
  email: string;
  roleType?: OrganizationRole;
  roleId?: string;
  /** Required (>= 1) when roleId is a LOCAL role; ignored otherwise. */
  locations?: InviteLocationInput[];
}

export interface ILocationOption {
  id: string;
  name: string;
}

export interface IAssignableLocations {
  branches: ILocationOption[];
  warehouses: ILocationOption[];
}

export interface IMemberLocation {
  branchMemberId?: string;
  warehouseMemberId?: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  roleId: string | null;
  roleName: string | null;
}

export interface IMember {
  id: string; // membershipId
  userId: string;
  roleType: OrganizationRole;
  roleId: string | null;
  roleName: string | null;
  user: { id: string; name: string; email: string; image?: string | null };
  branches: IMemberLocation[];
  warehouses: IMemberLocation[];
}

export interface CreateRoleRequest {
  name: string;
  kind: RoleKind;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  permissionIds?: string[];
}

export interface IMembershipInvite {
  id: string;
  email: string;
  organizationId: string;
  organizationName?: string;
  roleId?: string;
  roleType?: OrganizationRole;
  token: string;
  createdAt: string;
}

/** The current user's access summary for an org. */
export interface IMyAccess {
  membershipId: string;
  roleType: OrganizationRole;
  roleId: string | null;
  permissions: string[];
}

export const membershipApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // --- Permissions ---
    getPermissionDefinitions: builder.query<IPermissionCategory[], void>({
      query: () => ({
        url: "/membership/permissions/definitions",
        method: "GET",
      }),
    }),

    // --- Invites ---
    getMyInvites: builder.query<IMembershipInvite[], void>({
      query: () => ({
        url: "/membership/my-invites",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Membership" as const, id })),
            { type: "Membership", id: "INVITE_LIST" },
          ]
          : [{ type: "Membership", id: "INVITE_LIST" }],
    }),

    acceptInvite: builder.mutation<void, string>({
      query: (token) => ({
        url: `/membership/invites/accept/${token}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Membership", id: "INVITE_LIST" }],
    }),

    inviteMember: builder.mutation<void, { organizationId: string; body: InviteMemberRequest }>({
      query: ({ organizationId, body }) => ({
        url: `/membership/${organizationId}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Membership", id: "INVITE_LIST" }],
    }),

    // --- Roles ---
    getOrgRoles: builder.query<IRole[], string>({
      query: (orgId) => ({
        url: `/membership/${orgId}/roles`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.map(r => ({ type: 'Membership' as const, id: r.id })),
            { type: 'Membership', id: 'ROLE_LIST' }
          ]
          : [{ type: 'Membership', id: 'ROLE_LIST' }]
    }),

    getRoleDetails: builder.query<IRole, { organizationId: string; roleId: string }>({
      query: ({ organizationId, roleId }) => ({
        url: `/membership/${organizationId}/roles/${roleId}`,
        method: "GET",
      }),
      providesTags: (result, error, { roleId }) => [{ type: "Membership", id: roleId }],
    }),

    createRole: builder.mutation<IRole, { organizationId: string; body: CreateRoleRequest }>({
      query: ({ organizationId, body }) => ({
        url: `/membership/${organizationId}/roles`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: 'Membership', id: 'ROLE_LIST' }],
    }),

    updateRole: builder.mutation<void, { organizationId: string; roleId: string; body: UpdateRoleRequest }>({
      query: ({ organizationId, roleId, body }) => ({
        url: `/membership/${organizationId}/roles/${roleId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { roleId }) => [
        { type: "Membership", id: roleId },
        { type: "Membership", id: "ROLE_LIST" }
      ],
    }),

    // --- Members ---
    getMembers: builder.query<IMember[], string>({
      query: (orgId) => ({
        url: `/membership/${orgId}/members`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.map((m) => ({ type: "Membership" as const, id: m.id })),
            { type: "Membership", id: "MEMBER_LIST" },
          ]
          : [{ type: "Membership", id: "MEMBER_LIST" }],
    }),

    getAssignableLocations: builder.query<IAssignableLocations, string>({
      query: (orgId) => ({
        url: `/membership/${orgId}/locations`,
        method: "GET",
      }),
    }),

    // Current user's role type + granted permission slugs for this org.
    getMyAccess: builder.query<IMyAccess, string>({
      query: (orgId) => ({
        url: `/membership/${orgId}/me`,
        method: "GET",
      }),
      providesTags: (_result, _error, orgId) => [{ type: "Membership", id: `ME_${orgId}` }],
    }),

    setMemberRole: builder.mutation<void, { organizationId: string; membershipId: string; roleId?: string | null }>({
      query: ({ organizationId, membershipId, roleId }) => ({
        url: `/membership/${organizationId}/members/${membershipId}/role`,
        method: "PUT",
        body: { roleId: roleId ?? undefined },
      }),
      invalidatesTags: [{ type: "Membership", id: "MEMBER_LIST" }],
    }),

    assignBranchRole: builder.mutation<void, { organizationId: string; membershipId: string; branchId: string; roleId?: string | null }>({
      query: ({ organizationId, membershipId, branchId, roleId }) => ({
        url: `/membership/${organizationId}/members/${membershipId}/branches/${branchId}`,
        method: "PUT",
        body: { roleId: roleId ?? undefined },
      }),
      invalidatesTags: [{ type: "Membership", id: "MEMBER_LIST" }],
    }),

    removeBranchRole: builder.mutation<void, { organizationId: string; membershipId: string; branchId: string }>({
      query: ({ organizationId, membershipId, branchId }) => ({
        url: `/membership/${organizationId}/members/${membershipId}/branches/${branchId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Membership", id: "MEMBER_LIST" }],
    }),

    assignWarehouseRole: builder.mutation<void, { organizationId: string; membershipId: string; warehouseId: string; roleId?: string | null }>({
      query: ({ organizationId, membershipId, warehouseId, roleId }) => ({
        url: `/membership/${organizationId}/members/${membershipId}/warehouses/${warehouseId}`,
        method: "PUT",
        body: { roleId: roleId ?? undefined },
      }),
      invalidatesTags: [{ type: "Membership", id: "MEMBER_LIST" }],
    }),

    removeWarehouseRole: builder.mutation<void, { organizationId: string; membershipId: string; warehouseId: string }>({
      query: ({ organizationId, membershipId, warehouseId }) => ({
        url: `/membership/${organizationId}/members/${membershipId}/warehouses/${warehouseId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Membership", id: "MEMBER_LIST" }],
    }),

    // --- Membership Management ---
    leaveOrganization: builder.mutation<void, string>({
      query: (organizationId) => ({
        url: `/membership/${organizationId}/leave`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Membership", id: "INVITE_LIST" }, { type: "Membership", id: "ROLE_LIST" }],
    }),
  }),
});

export const {
  useGetPermissionDefinitionsQuery,
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useInviteMemberMutation,
  useGetOrgRolesQuery,
  useGetRoleDetailsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useLeaveOrganizationMutation,
  useGetMembersQuery,
  useGetAssignableLocationsQuery,
  useGetMyAccessQuery,
  useSetMemberRoleMutation,
  useAssignBranchRoleMutation,
  useRemoveBranchRoleMutation,
  useAssignWarehouseRoleMutation,
  useRemoveWarehouseRoleMutation,
} = membershipApi;
