import { apiSlice } from "../api";
import type {
  IPlan,
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

  }),
});

export const {
  useGetPlansQuery,
  useGetPlanByIdQuery,
} = planApi;
