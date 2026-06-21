import { apiSlice } from "../api";

/**
 * Notifications API. Mirrors the backend `/notifications` controller (scoped to
 * the authenticated user via the session cookie — no orgId in the path).
 */

export type NotificationType =
  | "APPROVAL_REQUESTED"
  | "APPROVAL_APPROVED"
  | "APPROVAL_REJECTED"
  | "LOW_STOCK"
  | "SALE_RECORDED"
  | "MEMBER_JOINED"
  | "ROLE_CHANGED";

export interface INotificationActor {
  id: string;
  name: string;
  image?: string | null;
}

export interface INotification {
  id: string;
  organizationId: string;
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  actor?: INotificationActor | null;
}

export interface NotificationsResponse {
  items: INotification[];
  unreadCount: number;
}

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationsResponse,
      { limit?: number; offset?: number } | void
    >({
      query: (args) => ({
        url: "/notifications",
        method: "GET",
        params: args ?? undefined,
      }),
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),

    markNotificationRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),

    markAllNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
