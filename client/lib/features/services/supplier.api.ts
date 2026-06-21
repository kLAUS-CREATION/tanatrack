import { apiSlice } from "../api";
import type { MaybePending } from "./change-request.api";

export interface ISupplier {
  id: string;
  organizationId: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {}

export const supplierApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<ISupplier[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/suppliers`, method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Supplier" as const, id })),
              { type: "Supplier", id: "LIST" },
            ]
          : [{ type: "Supplier", id: "LIST" }],
    }),

    getSupplier: builder.query<ISupplier, { orgId: string; supplierId: string }>({
      query: ({ orgId, supplierId }) => ({
        url: `/org/${orgId}/suppliers/${supplierId}`,
        method: "GET",
      }),
      providesTags: (result, error, { supplierId }) => [
        { type: "Supplier", id: supplierId },
      ],
    }),

    createSupplier: builder.mutation<
      MaybePending<ISupplier>,
      { orgId: string; body: CreateSupplierRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/suppliers`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Supplier", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    updateSupplier: builder.mutation<
      MaybePending<ISupplier>,
      { orgId: string; supplierId: string; body: UpdateSupplierRequest }
    >({
      query: ({ orgId, supplierId, body }) => ({
        url: `/org/${orgId}/suppliers/${supplierId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { supplierId }) => [
        { type: "Supplier", id: supplierId },
        { type: "Supplier", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<
      MaybePending<{ success: boolean }>,
      { orgId: string; supplierId: string }
    >({
      query: ({ orgId, supplierId }) => ({
        url: `/org/${orgId}/suppliers/${supplierId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Supplier", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;
