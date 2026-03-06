import { apiSlice } from "../api";
import type {
  IOrganization,
  CreateOrganizationRequest,
  UpgradePlanRequest
} from "@/types/organization";

export const organizationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Get all organizations for the current user
    getOrganizations: builder.query<IOrganization[], void>({
      query: () => ({
        url: "/organizations",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Organizations" as const, id })),
              { type: "Organizations", id: "LIST" },
            ]
          : [{ type: "Organizations", id: "LIST" }],
    }),

    // Get specific organization details
    getOrganizationById: builder.query<IOrganization, string>({
      query: (id) => ({
        url: `/organizations/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Organizations", id }],
    }),

    // Create a new organization
    createOrganization: builder.mutation<IOrganization, CreateOrganizationRequest>({
      query: (body) => ({
        url: "/organizations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Organizations", id: "LIST" }],
    }),

    // Upgrade organization plan
    upgradePlan: builder.mutation<IOrganization, { id: string; body: UpgradePlanRequest }>({
      query: ({ id, body }) => ({
        url: `/organizations/${id}/upgrade`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Organizations", id },
        { type: "Organizations", id: "LIST" },
        // We also invalidate Plans list as it might affect subscription stats
        { type: "Plans", id: "LIST" }
      ],
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpgradePlanMutation,
} = organizationApi;
