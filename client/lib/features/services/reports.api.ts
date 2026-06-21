import { apiSlice } from "../api";

export interface ReportKpis {
  salesRevenue: number;
  purchaseSpend: number;
  cogs: number;
  grossProfit: number;
  /** grossProfit / salesRevenue, as a 0..1 ratio. */
  grossMargin: number;
  averageOrderValue: number;
  /** Outstanding receivable: billed minus tendered. */
  receivables: number;
  returnsTotal: number;
  inventoryValue: number;
  inventoryUnits: number;
  salesCount: number;
  purchaseCount: number;
  productCount: number;
  lowStockCount: number;
}

export interface SalesTrendPoint {
  date: string;
  total: number;
}

export interface RevenueSpendPoint {
  date: string;
  revenue: number;
  spend: number;
}

export interface BranchSalesRow {
  name: string;
  total: number;
  count: number;
}

export interface PaymentMethodRow {
  method: string;
  total: number;
  count: number;
}

export interface LocationValueRow {
  name: string;
  value: number;
  units: number;
}

export interface TopProduct {
  name: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

export interface TopCustomer {
  name: string;
  revenue: number;
  orders: number;
}

export interface CategoryRevenueRow {
  name: string;
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
  revenueVsSpend: RevenueSpendPoint[];
  salesByBranch: BranchSalesRow[];
  paymentMethods: PaymentMethodRow[];
  inventoryByLocation: LocationValueRow[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  topCategories: CategoryRevenueRow[];
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
