import { apiSlice } from "../api";

/**
 * Unified maker-checker change-request API. Mirrors the backend
 * `/org/:id/change-requests` controller, which covers every maker-checker
 * domain (products, variants, categories, suppliers, …) in a single queue +
 * audit log.
 */

export type ChangeStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ChangeEntity =
  | "PRODUCT"
  | "VARIANT"
  | "CATEGORY"
  | "SUPPLIER"
  | "PURCHASE"
  | "STOCK_MOVE";
export type ChangeOp = "CREATE" | "UPDATE" | "DELETE";

export interface IChangeActor {
  id: string;
  name: string;
  email: string;
}

export interface IChangeRequest {
  id: string;
  organizationId: string;
  entity: ChangeEntity;
  operation: ChangeOp;
  productId?: string | null;
  variantId?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  purchaseId?: string | null;
  payload?: Record<string, unknown> | null;
  status: ChangeStatus;
  requestedBy: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reason?: string | null;
  appliedRefId?: string | null;
  createdAt: string;
  updatedAt: string;
  requestedByUser?: IChangeActor | null;
  reviewedByUser?: IChangeActor | null;
}

/**
 * A maker-checker mutation either applies directly (approver) and returns the
 * affected entity, or is queued and returns the PENDING change request.
 * `isPendingChange` narrows the union for callers (e.g. to toast "submitted").
 */
export type MaybePending<T> = T | IChangeRequest;

export function isPendingChange(res: unknown): res is IChangeRequest {
  return (
    !!res &&
    typeof res === "object" &&
    "status" in res &&
    (res as IChangeRequest).status === "PENDING"
  );
}

export const changeRequestApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Approver view: every request in the org, optionally filtered by status.
    getChangeRequests: builder.query<
      IChangeRequest[],
      { orgId: string; status?: ChangeStatus }
    >({
      query: ({ orgId, status }) => ({
        url: `/org/${orgId}/change-requests`,
        method: "GET",
        params: status ? { status } : undefined,
      }),
      providesTags: [{ type: "ChangeRequest", id: "LIST" }],
    }),

    // Maker view: the requests the current user submitted.
    getMyChangeRequests: builder.query<IChangeRequest[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/change-requests/mine`,
        method: "GET",
      }),
      providesTags: [{ type: "ChangeRequest", id: "LIST" }],
    }),

    approveChangeRequest: builder.mutation<
      IChangeRequest,
      { orgId: string; requestId: string }
    >({
      query: ({ orgId, requestId }) => ({
        url: `/org/${orgId}/change-requests/${requestId}/approve`,
        method: "POST",
      }),
      // Applying a change touches the underlying entity, so invalidate broadly.
      // Approving a purchase also moves stock + writes the ledger.
      invalidatesTags: [
        { type: "ChangeRequest", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "ProductCategory", id: "LIST" },
        { type: "Supplier", id: "LIST" },
        { type: "Purchase", id: "LIST" },
        { type: "StockLevel", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
        { type: "Report", id: "OVERVIEW" },
      ],
    }),

    rejectChangeRequest: builder.mutation<
      IChangeRequest,
      { orgId: string; requestId: string; reason?: string }
    >({
      query: ({ orgId, requestId, reason }) => ({
        url: `/org/${orgId}/change-requests/${requestId}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [{ type: "ChangeRequest", id: "LIST" }],
    }),
  }),
});

export const {
  useGetChangeRequestsQuery,
  useGetMyChangeRequestsQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
} = changeRequestApi;
