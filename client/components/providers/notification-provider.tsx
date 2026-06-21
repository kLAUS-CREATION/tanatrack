"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useAuth } from "./auth-provider";
import { apiSlice } from "@/lib/features/api";
import type { INotification } from "@/lib/features/services/notifications.api";

// The socket server is the API host without the `/api` REST prefix.
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");

/**
 * Opens an authenticated socket.io connection for the signed-in user (identity is
 * derived server-side from the session cookie) and turns incoming notifications
 * into a toast + an RTK cache refresh so the bell badge updates in real time.
 */
export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const dispatch = useDispatch();
  const userId = session?.user?.id;

  React.useEffect(() => {
    if (!userId || !SOCKET_URL) return;

    const socket: Socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("notification", (payload: INotification) => {
      toast(payload.title, { description: payload.body ?? undefined });
      // Refresh the bell list + unread count.
      dispatch(
        apiSlice.util.invalidateTags([{ type: "Notification", id: "LIST" }]),
      );
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [userId, dispatch]);

  return <>{children}</>;
}
