import { apiSlice } from "../api";
import type { IProductVariant } from "./product.api";

export interface ISaleItem {
  id: string;
  saleId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
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
  total: number;
  createdAt: string;
  items?: ISaleItem[];
  branch?: { id: string; name: string };
  customer?: { id: string; name: string } | null;
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
  items: SaleItemInput[];
}

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<ISale[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/sales`, method: "GET" }),
      providesTags: [{ type: "Sale", id: "LIST" }],
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
      ],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetBranchSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
} = salesApi;
