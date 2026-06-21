import { apiSlice } from "../api";
import type {
  IPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  SyncFeaturesRequest
} from "@/types/plans";

export const planApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Get all plans (Everyone)
    getPlans: builder.query<IPlan[], void>({
      query: () => ({
        url: "/plans",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Plans" as const, id })),
              { type: "Plans", id: "LIST" },
            ]
          : [{ type: "Plans", id: "LIST" }],
    }),

    // Get a single plan by ID
    getPlanById: builder.query<IPlan, string>({
      query: (id) => ({
        url: `/plans/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Plans", id }],
    }),

    // Create a new plan (Admin Only)
    createPlan: builder.mutation<IPlan, CreatePlanRequest>({
      query: (body) => ({
        url: "/plans",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Plans", id: "LIST" }],
    }),

    // Update basic plan details (Admin Only)
    updatePlan: builder.mutation<IPlan, { id: string; body: UpdatePlanRequest }>({
      query: ({ id, body }) => ({
        url: `/plans/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Plans", id },
        { type: "Plans", id: "LIST" },
      ],
    }),

    // Specifically sync features for a plan (Admin Only)
    syncPlanFeatures: builder.mutation<IPlan, { id: string; body: SyncFeaturesRequest }>({
      query: ({ id, body }) => ({
        url: `/plans/${id}/features`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Plans", id },
        { type: "Plans", id: "LIST" },
      ],
    }),

    // Delete/Deactivate a plan (Admin Only)
    deletePlan: builder.mutation<void, string>({
      query: (id) => ({
        url: `/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Plans", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetPlanByIdQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useSyncPlanFeaturesMutation,
  useDeletePlanMutation,
} = planApi;
