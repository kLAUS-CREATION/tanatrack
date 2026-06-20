import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";

/**
 * Shape of the error our axiosBaseQuery returns: `{ status, data }` where
 * `data` is the server's JSON body (Nest: `{ message, statusCode, error }`)
 * or a plain string for network/transport errors.
 */
interface RejectedPayload {
  status?: number;
  data?: unknown;
}

function extractMessage(payload: RejectedPayload | undefined): string {
  const status = payload?.status;
  const data = payload?.data as
    | { message?: string | string[] }
    | string
    | undefined;

  // Nest validation errors arrive as `message: string[]`.
  if (data && typeof data === "object" && data.message) {
    return Array.isArray(data.message)
      ? data.message[0] ?? "Something went wrong"
      : data.message;
  }
  if (typeof data === "string" && data.trim()) return data;

  // Status-based fallbacks when the body carries no message.
  if (status === undefined) {
    return "Network error — please check your connection and try again.";
  }
  if (status >= 500) return "Something went wrong on our end. Please try again.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 408) return "The request timed out. Please try again.";
  return "Request failed. Please try again.";
}

/**
 * Global RTK Query error surfacing. Mutations already toast from their own
 * handlers, so this only fires for **queries** (GET loads) — which otherwise
 * fail silently and are only visible in the network tab. Auth (401) and
 * permission (403) rejections are skipped: those are handled by redirects /
 * intentional permission-gated fetches and would otherwise spam the user.
 */
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const arg = action.meta.arg as {
      type?: string;
      endpointName?: string;
    };
    const payload = action.payload as RejectedPayload | undefined;
    const status = payload?.status;

    if (
      arg?.type === "query" &&
      status !== 401 &&
      status !== 403 &&
      typeof window !== "undefined"
    ) {
      // Collapse repeats of the same failing endpoint into one toast.
      toast.error(extractMessage(payload), {
        id: `query-error-${arg.endpointName ?? "request"}`,
      });
    }
  }

  return next(action);
};
