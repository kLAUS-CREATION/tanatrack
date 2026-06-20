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

// Move stock from one location to another. Source and destination each take
// exactly one of branchId / warehouseId and must differ.
export interface CreateTransferRequest {
  variantId: string;
  quantity: number;
  fromBranchId?: string;
  fromWarehouseId?: string;
  toBranchId?: string;
  toWarehouseId?: string;
  reason?: string;
  reference?: string;
}

// Write off all expired units of a perishable variant at one location (or the
// receiving pool when no location is given). The exact quantity is recomputed
// server-side when applied.
export interface WriteOffExpiredRequest {
  variantId: string;
  branchId?: string;
  warehouseId?: string;
  reason?: string;
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

    // Like allocations, location → location transfers run through maker-checker:
    // makers queue a change request, approvers apply instantly (MaybePending).
    createTransfer: builder.mutation<
      MaybePending<IStockMovement>,
      { orgId: string; body: CreateTransferRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/allocations/transfer`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    // Maker-checker like allocations: makers queue, approvers apply instantly.
    writeOffExpired: builder.mutation<
      MaybePending<IStockMovement>,
      { orgId: string; body: WriteOffExpiredRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/allocations/write-off`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "StockBatch", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateAllocationMutation,
  useCreateTransferMutation,
  useWriteOffExpiredMutation,
} = allocationApi;
