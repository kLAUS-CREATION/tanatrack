import { apiSlice } from "../api";

export interface ReportKpis {
  salesRevenue: number;
  purchaseSpend: number;
  cogs: number;
  grossProfit: number;
  inventoryValue: number;
  salesCount: number;
  purchaseCount: number;
  productCount: number;
  lowStockCount: number;
}

export interface SalesTrendPoint {
  date: string;
  total: number;
}

export interface TopProduct {
  name: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

export interface LowStockRow {
  product: string;
  variant: string;
  sku: string;
  location: string;
  quantity: number;
  reorderPoint: number;
}

export interface ReportOverview {
  kpis: ReportKpis;
  salesTrend: SalesTrendPoint[];
  topProducts: TopProduct[];
  lowStock: LowStockRow[];
}

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReportOverview: builder.query<ReportOverview, string>({
      query: (orgId) => ({
        url: `/org/${orgId}/reports/overview`,
        method: "GET",
      }),
      providesTags: [{ type: "Report", id: "OVERVIEW" }],
    }),
  }),
});

export const { useGetReportOverviewQuery } = reportsApi;
