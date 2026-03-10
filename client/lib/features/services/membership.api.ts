import { apiSlice } from "../api";

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export interface IPermissionDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  action: string;
}

export interface IPermissionCategory {
  category: string;
  permissions: IPermissionDefinition[];
}

export interface IRole {
  id: string;
  name: string;
  organizationId: string;
  permissions?: {
    permissionDefinitionId: string;
    allowed: boolean;
  }[];
  _count?: {
    memberships: number;
  };
}

export interface InviteMemberRequest {
  email: string;
  roleId?: string;
  roleType?: OrganizationRole;
}

export interface CreateRoleRequest {
  name: string;
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
  token: string;
  createdAt: string;
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
} = membershipApi;
