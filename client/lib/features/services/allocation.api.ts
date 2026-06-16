import { apiSlice } from "../api";
import type { IStockMovement } from "./inventory.api";
import type { MaybePending } from "./change-request.api";

// Move received (pool) stock to a destination location.
// Destination: exactly one of branchId / warehouseId.
export interface CreateAllocationRequest {
  variantId: string;
  quantity: number;
  branchId?: string;
  warehouseId?: string;
  reason?: string;
  reference?: string;
}

export const allocationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Makers' allocations queue as a change request (no stock moves until
    // approved); approvers apply instantly. Hence the MaybePending result.
    createAllocation: builder.mutation<
      MaybePending<IStockMovement>,
      { orgId: string; body: CreateAllocationRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/allocations`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),
  }),
});

export const { useCreateAllocationMutation } = allocationApi;
