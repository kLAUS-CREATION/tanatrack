"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ClipboardCheck, Loader2 } from "lucide-react";
import {
  describeChange,
  changeEntityIcon,
  OP_VARIANT,
} from "@/lib/features/change-request-display";
import {
  useGetChangeRequestsQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
} from "@/lib/features/services/change-request.api";

/**
 * Compact inline queue shown to admins on the Products page — only product /
 * variant / category requests awaiting review. The full org-wide queue (incl.
 * suppliers) lives under Administration → Approvals.
 */
export function PendingProductChanges({ orgId }: { orgId: string }) {
  const { data: requests, isLoading } = useGetChangeRequestsQuery({
    orgId,
    status: "PENDING",
  });
  const [approve, { isLoading: isApproving }] =
    useApproveChangeRequestMutation();
  const [reject, { isLoading: isRejecting }] = useRejectChangeRequestMutation();
  const busy = isApproving || isRejecting;

  const productRequests = (requests ?? []).filter((r) =>
    ["PRODUCT", "VARIANT", "CATEGORY"].includes(r.entity),
  );

  const handleApprove = async (requestId: string) => {
    try {
      await approve({ orgId, requestId }).unwrap();
      toast.success("Change approved and applied");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to approve change");
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Reason for rejecting this change? (optional)") ?? undefined;
    try {
      await reject({ orgId, requestId, reason }).unwrap();
      toast.success("Change rejected");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to reject change");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading pending changes…
      </div>
    );
  }

  if (!productRequests.length) return null;

  return (
    <div className="mb-8 rounded-sm border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold">Pending approval</h2>
        <Badge variant="secondary">{productRequests.length}</Badge>
      </div>

      <div className="grid gap-3">
        {productRequests.map((req) => {
          const Icon = changeEntityIcon(req.entity);
          return (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-sm border bg-background"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-sm border flex items-center justify-center text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{describeChange(req)}</h4>
                    <Badge variant={OP_VARIANT[req.operation] ?? "secondary"}>
                      {req.operation}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requested by{" "}
                    {req.requestedByUser?.name ??
                      req.requestedByUser?.email ??
                      "a member"}{" "}
                    · {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={busy}
                  onClick={() => handleReject(req.id)}
                >
                  <X className="mr-1.5 h-4 w-4" /> Reject
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => handleApprove(req.id)}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
