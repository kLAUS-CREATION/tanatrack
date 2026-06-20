import { apiSlice } from "../api";
import type { IProductVariant } from "./product.api";

export type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY";
export type PaymentStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface ISaleItem {
  id: string;
  saleId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  returnedQuantity: number;
  variant?: IProductVariant;
}

export interface ISale {
  id: string;
  organizationId: string;
  branchId: string;
  soldBy: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  refundedTotal: number;
  paymentMethod?: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentRef?: string | null;
  createdAt: string;
  items?: ISaleItem[];
  branch?: { id: string; name: string };
  customer?: { id: string; name: string } | null;
  seller?: { id: string; name: string; image?: string | null } | null;
}

export interface SaleItemInput {
  variantId: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateSaleRequest {
  branchId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  discount?: number;
  tax?: number;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  paymentRef?: string;
  items: SaleItemInput[];
}

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
}

export interface CreateReturnRequest {
  reason?: string;
  items: ReturnItemInput[];
}

export interface ISaleReturn {
  id: string;
  saleId: string;
  branchId: string;
  total: number;
  reason?: string | null;
  createdAt: string;
}

export interface ISellableBranch {
  id: string;
  name: string;
}

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<ISale[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/sales`, method: "GET" }),
      providesTags: [{ type: "Sale", id: "LIST" }],
    }),

    // Branches the current user may record a sale at (holds SALES_CREATE there).
    getSellableBranches: builder.query<ISellableBranch[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/sales/sellable-branches`,
        method: "GET",
      }),
    }),

    getBranchSales: builder.query<ISale[], { orgId: string; branchId: string }>({
      query: ({ orgId, branchId }) => ({
        url: `/org/${orgId}/sales/branch/${branchId}`,
        method: "GET",
      }),
      providesTags: [{ type: "Sale", id: "LIST" }],
    }),

    getSale: builder.query<ISale, { orgId: string; saleId: string }>({
      query: ({ orgId, saleId }) => ({
        url: `/org/${orgId}/sales/${saleId}`,
        method: "GET",
      }),
      providesTags: (result, error, { saleId }) => [{ type: "Sale", id: saleId }],
    }),

    createSale: builder.mutation<
      ISale,
      { orgId: string; body: CreateSaleRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/sales`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Sale", id: "LIST" },
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "Customer", id: "LIST" },
      ],
    }),

    createReturn: builder.mutation<
      ISaleReturn,
      { orgId: string; saleId: string; body: CreateReturnRequest }
    >({
      query: ({ orgId, saleId, body }) => ({
        url: `/org/${orgId}/sales/${saleId}/returns`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Sale", id: "LIST" },
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "Customer", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSellableBranchesQuery,
  useGetBranchSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useCreateReturnMutation,
} = salesApi;
