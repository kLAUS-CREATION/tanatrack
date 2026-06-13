import { apiSlice } from "../api";
import type { IProductVariant } from "./product.api";

export enum MovementType {
  PURCHASE_IN = "PURCHASE_IN",
  SALE_OUT = "SALE_OUT",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
}

export interface IStockLevel {
  id: string;
  variantId: string;
  branchId?: string | null;
  warehouseId?: string | null;
  quantity: number;
  reorderPoint?: number | null;
  variant?: IProductVariant & { product?: { id: string; name: string } };
  branch?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
}

export interface IStockMovement {
  id: string;
  variantId: string;
  type: MovementType;
  quantity: number;
  reason?: string | null;
  reference?: string | null;
  performedBy: string;
  fromBranchId?: string | null;
  fromWarehouseId?: string | null;
  toBranchId?: string | null;
  toWarehouseId?: string | null;
  createdAt: string;
  variant?: IProductVariant & { product?: { id: string; name: string } };
  fromBranch?: { id: string; name: string } | null;
  fromWarehouse?: { id: string; name: string } | null;
  toBranch?: { id: string; name: string } | null;
  toWarehouse?: { id: string; name: string } | null;
}

// Exactly one of branchId / warehouseId
export interface LocationInput {
  branchId?: string;
  warehouseId?: string;
}

export interface PurchaseInRequest extends LocationInput {
  variantId: string;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface AdjustStockRequest extends LocationInput {
  variantId: string;
  quantity: number; // absolute target
  reorderPoint?: number;
  reason?: string;
}

export interface TransferStockRequest {
  variantId: string;
  quantity: number;
  from: LocationInput;
  to: LocationInput;
  reason?: string;
  reference?: string;
}

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalStock: builder.query<IStockLevel[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/inventory/stock`, method: "GET" }),
      providesTags: [{ type: "StockLevel", id: "LIST" }],
    }),

    getLocationStock: builder.query<
      IStockLevel[],
      { orgId: string; branchId?: string; warehouseId?: string }
    >({
      query: ({ orgId, branchId, warehouseId }) => ({
        url: `/org/${orgId}/inventory/stock/location`,
        method: "GET",
        params: { branchId, warehouseId },
      }),
      providesTags: [{ type: "StockLevel", id: "LIST" }],
    }),

    getMovements: builder.query<
      IStockMovement[],
      { orgId: string; variantId?: string }
    >({
      query: ({ orgId, variantId }) => ({
        url: `/org/${orgId}/inventory/movements`,
        method: "GET",
        params: { variantId },
      }),
      providesTags: [{ type: "StockMovement", id: "LIST" }],
    }),

    purchaseIn: builder.mutation<
      IStockMovement,
      { orgId: string; body: PurchaseInRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/inventory/purchase-in`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    adjustStock: builder.mutation<
      IStockMovement,
      { orgId: string; body: AdjustStockRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/inventory/adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    transferStock: builder.mutation<
      IStockMovement,
      { orgId: string; body: TransferStockRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/inventory/transfer`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetGlobalStockQuery,
  useGetLocationStockQuery,
  useGetMovementsQuery,
  usePurchaseInMutation,
  useAdjustStockMutation,
  useTransferStockMutation,
} = inventoryApi;
