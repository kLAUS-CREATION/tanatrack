import { apiSlice } from "../api";

export interface IWarehouse {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  code?: string;
  address?: string;
}

export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {}

export const warehouseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouses: builder.query<IWarehouse[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/warehouses`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Warehouse" as const, id })),
              { type: "Warehouse", id: "LIST" },
            ]
          : [{ type: "Warehouse", id: "LIST" }],
    }),

    getWarehouseDetails: builder.query<IWarehouse, { orgId: string; warehouseId: string }>({
      query: ({ orgId, warehouseId }) => ({
        url: `/org/${orgId}/warehouses/${warehouseId}`,
        method: "GET",
      }),
      providesTags: (result, error, { warehouseId }) => [{ type: "Warehouse", id: warehouseId }],
    }),

    createWarehouse: builder.mutation<IWarehouse, { orgId: string; body: CreateWarehouseRequest }>({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/warehouses`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Warehouse", id: "LIST" }],
    }),

    updateWarehouse: builder.mutation<IWarehouse, { orgId: string; warehouseId: string; body: UpdateWarehouseRequest }>({
      query: ({ orgId, warehouseId, body }) => ({
        url: `/org/${orgId}/warehouses/${warehouseId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: "Warehouse", id: warehouseId },
        { type: "Warehouse", id: "LIST" },
      ],
    }),

    deleteWarehouse: builder.mutation<void, { orgId: string; warehouseId: string }>({
      query: ({ orgId, warehouseId }) => ({
        url: `/org/${orgId}/warehouses/${warehouseId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Warehouse", id: "LIST" }],
    }),
  }),
});

export const {
  useGetWarehousesQuery,
  useGetWarehouseDetailsQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehouseApi;
