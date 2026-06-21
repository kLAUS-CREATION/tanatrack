import { apiSlice } from "../api";
import type {
  IFeature,
  CreateFeatureRequest,
  UpdateFeatureRequest
} from "@/types/features";

export const featureApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Get all features
    getFeatures: builder.query<IFeature[], void>({
      query: () => ({
        url: "/features",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Features" as const, id })),
              { type: "Features", id: "LIST" },
            ]
          : [{ type: "Features", id: "LIST" }],
    }),

    // Get a single feature by ID
    getFeatureById: builder.query<IFeature, string>({
      query: (id) => ({
        url: `/features/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Features", id }],
    }),

    // Create a new feature
    createFeature: builder.mutation<IFeature, CreateFeatureRequest>({
      query: (body) => ({
        url: "/features",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Features", id: "LIST" }],
    }),

    // Update an existing feature
    updateFeature: builder.mutation<IFeature, { id: string; body: UpdateFeatureRequest }>({
      query: ({ id, body }) => ({
        url: `/features/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Features", id },
        { type: "Features", id: "LIST" },
      ],
    }),

    // Delete a feature
    deleteFeature: builder.mutation<void, string>({
      query: (id) => ({
        url: `/features/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Features", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFeaturesQuery,
  useGetFeatureByIdQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
} = featureApi;
