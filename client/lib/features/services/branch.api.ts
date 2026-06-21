import { apiSlice } from "../api";

export enum BranchType {
  OFFICE = 'OFFICE',
  RETAIL = 'RETAIL',
  SHOWROOM = 'SHOWROOM',
  VIRTUAL = 'VIRTUAL',
}

export interface IBranch {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  type: BranchType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchRequest {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  type?: BranchType;
}

export interface UpdateBranchRequest extends Partial<CreateBranchRequest> {}

export const branchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<IBranch[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/branches`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Branch" as const, id })),
              { type: "Branch", id: "LIST" },
            ]
          : [{ type: "Branch", id: "LIST" }],
    }),

    getBranchDetails: builder.query<IBranch, { orgId: string; branchId: string }>({
      query: ({ orgId, branchId }) => ({
        url: `/org/${orgId}/branches/${branchId}`,
        method: "GET",
      }),
      providesTags: (result, error, { branchId }) => [{ type: "Branch", id: branchId }],
    }),

    createBranch: builder.mutation<IBranch, { orgId: string; body: CreateBranchRequest }>({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/branches`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Branch", id: "LIST" }],
    }),

    updateBranch: builder.mutation<IBranch, { orgId: string; branchId: string; body: UpdateBranchRequest }>({
      query: ({ orgId, branchId, body }) => ({
        url: `/org/${orgId}/branches/${branchId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { branchId }) => [
        { type: "Branch", id: branchId },
        { type: "Branch", id: "LIST" },
      ],
    }),

    deleteBranch: builder.mutation<void, { orgId: string; branchId: string }>({
      query: ({ orgId, branchId }) => ({
        url: `/org/${orgId}/branches/${branchId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Branch", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchDetailsQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchApi;
