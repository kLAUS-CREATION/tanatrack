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
}

// Purchases receive into the org receiving pool (no location); stock is allocated
// to a branch/warehouse later via the Allocations flow.
export interface CreatePurchaseRequest {
  supplierId?: string;
  supplierName?: string;
  reference?: string;
  items: PurchaseItemInput[];
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
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
} = purchaseApi;
