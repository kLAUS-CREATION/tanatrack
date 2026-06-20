import { apiSlice } from "../api";
import type { IProductVariant } from "./product.api";

export enum MovementType {
  PURCHASE_IN = "PURCHASE_IN",
  SALE_OUT = "SALE_OUT",
  SALE_RETURN = "SALE_RETURN",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
  EXPIRY_WRITE_OFF = "EXPIRY_WRITE_OFF",
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

// A dated lot of a perishable variant at one location (branch / warehouse /
// receiving pool when both are null). Drives the inventory Expiry view.
export interface IStockBatch {
  id: string;
  variantId: string;
  branchId?: string | null;
  warehouseId?: string | null;
  quantity: number;
  expiryDate: string;
  createdAt: string;
  variant?: IProductVariant & { product?: { id: string; name: string } };
  branch?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
}

// Exactly one of branchId / warehouseId
export interface LocationInput {
  branchId?: string;
  warehouseId?: string;
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

    getLowStock: builder.query<IStockLevel[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/inventory/low-stock`,
        method: "GET",
      }),
      providesTags: [{ type: "StockLevel", id: "LIST" }],
    }),

    // Dated expiry batches for perishable stock (pool + every location).
    getBatches: builder.query<IStockBatch[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/inventory/batches`,
        method: "GET",
      }),
      providesTags: [{ type: "StockBatch", id: "LIST" }],
    }),
  }),
});

export const {
  useGetGlobalStockQuery,
  useGetLocationStockQuery,
  useGetMovementsQuery,
  useGetLowStockQuery,
  useGetBatchesQuery,
} = inventoryApi;
