import { apiSlice } from "../api";
import type { IProductVariant } from "./product.api";
import type { MaybePending } from "./change-request.api";

export interface IPurchaseItem {
  id: string;
  purchaseId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  // Units returned to the supplier so far (caps partial returns).
  returnedQuantity: number;
  // Set when the product is perishable; mirrors the received StockBatch.
  expiryDate?: string | null;
  variant?: IProductVariant;
}

export interface IPurchase {
  id: string;
  organizationId: string;
  branchId?: string | null;
  warehouseId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  reference?: string | null;
  receivedBy: string;
  total: number;
  createdAt: string;
  items?: IPurchaseItem[];
  branch?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
}

export interface PurchaseItemInput {
  variantId: string;
  quantity: number;
  unitCost?: number;
  // ISO date; required by the server when the product is perishable.
  expiryDate?: string;
}

// Purchases receive into the org receiving pool (no location); stock is allocated
// to a branch/warehouse later via the Allocations flow.
export interface CreatePurchaseRequest {
  supplierId?: string;
  supplierName?: string;
  reference?: string;
  items: PurchaseItemInput[];
}

export interface IPurchaseReturnItem {
  id: string;
  returnId: string;
  purchaseItemId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  purchaseItem?: IPurchaseItem;
}

export interface IPurchaseReturn {
  id: string;
  organizationId: string;
  purchaseId: string;
  supplierId?: string | null;
  supplierName?: string | null;
  processedBy: string;
  total: number;
  reason?: string | null;
  createdAt: string;
  items?: IPurchaseReturnItem[];
}

export interface PurchaseReturnItemInput {
  purchaseItemId: string;
  quantity: number;
}

export interface CreatePurchaseReturnRequest {
  reason?: string;
  items: PurchaseReturnItemInput[];
}

export const purchaseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query<IPurchase[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/purchases`, method: "GET" }),
      providesTags: [{ type: "Purchase", id: "LIST" }],
    }),

    getPurchase: builder.query<IPurchase, { orgId: string; purchaseId: string }>(
      {
        query: ({ orgId, purchaseId }) => ({
          url: `/org/${orgId}/purchases/${purchaseId}`,
          method: "GET",
        }),
        providesTags: (result, error, { purchaseId }) => [
          { type: "Purchase", id: purchaseId },
        ],
      },
    ),

    // Makers' purchases queue as a change request (no stock moves until
    // approved); approvers apply instantly. Hence the MaybePending result.
    createPurchase: builder.mutation<
      MaybePending<IPurchase>,
      { orgId: string; body: CreatePurchaseRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/purchases`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Purchase", id: "LIST" },
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "Report", id: "OVERVIEW" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    getPurchaseReturns: builder.query<
      IPurchaseReturn[],
      { orgId: string; purchaseId: string }
    >({
      query: ({ orgId, purchaseId }) => ({
        url: `/org/${orgId}/purchases/${purchaseId}/returns`,
        method: "GET",
      }),
      providesTags: (result, error, { purchaseId }) => [
        { type: "Purchase", id: `${purchaseId}-returns` },
      ],
    }),

    // Returns to supplier apply directly (no maker-checker), reversing stock out
    // of the receiving pool — so refresh stock, the purchase list and reports.
    createPurchaseReturn: builder.mutation<
      IPurchaseReturn,
      { orgId: string; purchaseId: string; body: CreatePurchaseReturnRequest }
    >({
      query: ({ orgId, purchaseId, body }) => ({
        url: `/org/${orgId}/purchases/${purchaseId}/returns`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { purchaseId }) => [
        { type: "Purchase", id: "LIST" },
        { type: "Purchase", id: purchaseId },
        { type: "Purchase", id: `${purchaseId}-returns` },
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "Report", id: "OVERVIEW" },
      ],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useGetPurchaseReturnsQuery,
  useCreatePurchaseReturnMutation,
} = purchaseApi;
