"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  ClipboardCheck,
  Loader2,
  History,
  FilterX,
  CheckCircle2,
  XCircle,
  User2,
  CalendarClock,
} from "lucide-react";
import {
  FilterToolbar,
  type ActiveChip,
} from "@/components/dashboard/shared/filter-toolbar";
import {
  ChangeEntity,
  ChangeStatus,
  IChangeRequest,
  useGetChangeRequestsQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
} from "@/lib/features/services/change-request.api";
import {
  actorName,
  changeEntityIcon,
  changeEntityLabel,
  describeChange,
  OP_VARIANT,
  STATUS_VARIANT,
} from "@/lib/features/change-request-display";

const ENTITY_OPTIONS: { value: ChangeEntity; label: string }[] = [
  { value: "PRODUCT", label: "Products" },
  { value: "VARIANT", label: "Variants" },
  { value: "CATEGORY", label: "Categories" },
  { value: "SUPPLIER", label: "Suppliers" },
  { value: "PURCHASE", label: "Purchases" },
];

const ALL = "ALL";

const OP_LABEL: Record<string, string> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
};

interface HistoryFilters {
  search: string;
  entity: ChangeEntity | typeof ALL;
  operation: string;
  status: "APPROVED" | "REJECTED" | typeof ALL;
  reviewer: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: HistoryFilters = {
  search: "",
  entity: ALL,
  operation: ALL,
  status: ALL,
  reviewer: ALL,
  from: "",
  to: "",
};

export function ChangeApprovals() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data: requests, isLoading } = useGetChangeRequestsQuery({ orgId });
  const [approve, { isLoading: isApproving }] =
    useApproveChangeRequestMutation();
  const [reject, { isLoading: isRejecting }] = useRejectChangeRequestMutation();
  const busy = isApproving || isRejecting;

  const pending = useMemo(
    () => (requests ?? []).filter((r) => r.status === "PENDING"),
    [requests],
  );
  const reviewed = useMemo(
    () => (requests ?? []).filter((r) => r.status !== "PENDING"),
    [requests],
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
    const reason =
      prompt("Reason for declining this change? (optional)") ?? undefined;
    try {
      await reject({ orgId, requestId, reason }).unwrap();
      toast.success("Change declined");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to decline change");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading change requests…
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Approvals
        </h1>
        <p className="text-muted-foreground">
          Review changes submitted by your team and browse the full audit trail.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending approvals
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Approval history
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingTab pending={pending} busy={busy} onApprove={handleApprove} onReject={handleReject} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab reviewed={reviewed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
//  PENDING TAB
// ============================================================

function PendingTab({
  pending,
  busy,
  onApprove,
  onReject,
}: {
  pending: IChangeRequest[];
  busy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-sm text-center">
        <ClipboardCheck className="h-10 w-10 mb-3 text-muted-foreground/60" />
        <p className="font-medium">Nothing waiting for review</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Product, supplier and purchase changes submitted by your team will
          appear here for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {pending.map((req) => {
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
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium truncate">{describeChange(req)}</h4>
                  <Badge variant={OP_VARIANT[req.operation] ?? "secondary"}>
                    {req.operation}
                  </Badge>
                  <Badge variant="outline">{changeEntityLabel(req.entity)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Requested by {actorName(req.requestedByUser)} ·{" "}
                  {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={busy}
                onClick={() => onReject(req.id)}
              >
                <X className="mr-1.5 h-4 w-4" /> Decline
              </Button>
              <Button size="sm" disabled={busy} onClick={() => onApprove(req.id)}>
                <Check className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  HISTORY TAB (advanced filtering)
// ============================================================

function HistoryTab({ reviewed }: { reviewed: IChangeRequest[] }) {
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const set = (patch: Partial<HistoryFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  // Reviewers present in the data, for the reviewer dropdown.
  const reviewers = useMemo(() => {
    const byId = new Map<string, string>();
    for (const r of reviewed) {
      if (r.reviewedByUser)
        byId.set(r.reviewedByUser.id, actorName(r.reviewedByUser));
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [reviewed]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const fromTs = filters.from ? new Date(filters.from).getTime() : null;
    // `to` is inclusive of the whole day.
    const toTs = filters.to
      ? new Date(filters.to).getTime() + 24 * 60 * 60 * 1000
      : null;

    return reviewed.filter((r) => {
      if (filters.entity !== ALL && r.entity !== filters.entity) return false;
      if (filters.operation !== ALL && r.operation !== filters.operation)
        return false;
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.reviewer !== ALL && r.reviewedBy !== filters.reviewer)
        return false;

      const when = r.reviewedAt
        ? new Date(r.reviewedAt).getTime()
        : new Date(r.createdAt).getTime();
      if (fromTs !== null && when < fromTs) return false;
      if (toTs !== null && when >= toTs) return false;

      if (q) {
        const haystack = [
          describeChange(r),
          actorName(r.requestedByUser, ""),
          actorName(r.reviewedByUser, ""),
          r.reason ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reviewed, filters]);

  const chips: ActiveChip[] = [];
  if (filters.entity !== ALL)
    chips.push({
      key: "entity",
      label:
        ENTITY_OPTIONS.find((o) => o.value === filters.entity)?.label ?? "Type",
      onRemove: () => set({ entity: ALL }),
    });
  if (filters.operation !== ALL)
    chips.push({
      key: "operation",
      label: OP_LABEL[filters.operation] ?? filters.operation,
      onRemove: () => set({ operation: ALL }),
    });
  if (filters.status !== ALL)
    chips.push({
      key: "status",
      label: filters.status === "APPROVED" ? "Approved" : "Declined",
      onRemove: () => set({ status: ALL }),
    });
  if (filters.reviewer !== ALL)
    chips.push({
      key: "reviewer",
      label:
        reviewers.find((r) => r.id === filters.reviewer)?.name ?? "Reviewer",
      onRemove: () => set({ reviewer: ALL }),
    });
  if (filters.from)
    chips.push({
      key: "from",
      label: `From ${filters.from}`,
      onRemove: () => set({ from: "" }),
    });
  if (filters.to)
    chips.push({
      key: "to",
      label: `To ${filters.to}`,
      onRemove: () => set({ to: "" }),
    });

  if (reviewed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-sm text-center">
        <History className="h-10 w-10 mb-3 text-muted-foreground/60" />
        <p className="font-medium">No history yet</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Once changes are approved or declined, they&apos;ll be recorded here
          with who reviewed them and when.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterToolbar
        search={filters.search}
        onSearchChange={(v) => set({ search: v })}
        searchPlaceholder="Search by name, requester, reviewer or reason…"
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
        resultCount={filtered.length}
        totalCount={reviewed.length}
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={filters.entity}
            onValueChange={(v) => set({ entity: v as HistoryFilters["entity"] })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {ENTITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Action</Label>
            <Select
              value={filters.operation}
              onValueChange={(v) => set({ operation: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Outcome</Label>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                set({ status: v as HistoryFilters["status"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All outcomes</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Reviewed by</Label>
          <Select
            value={filters.reviewer}
            onValueChange={(v) => set({ reviewer: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Anyone</SelectItem>
              {reviewers.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => set({ from: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => set({ to: e.target.value })}
            />
          </div>
        </div>
      </FilterToolbar>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-sm text-center">
          <FilterX className="h-8 w-8 mb-3 text-muted-foreground/60" />
          <p className="font-medium">No matches</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting or clearing your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((req) => (
            <HistoryRow key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ req }: { req: IChangeRequest }) {
  const Icon = changeEntityIcon(req.entity);
  const approved = req.status === "APPROVED";
  return (
    <div className="flex flex-col gap-3 rounded-sm border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-sm border flex items-center justify-center text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium truncate">
              {describeChange(req)}
            </span>
            <Badge variant={OP_VARIANT[req.operation] ?? "secondary"}>
              {req.operation}
            </Badge>
            <Badge variant="outline">{changeEntityLabel(req.entity)}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User2 className="h-3 w-3" />
              {actorName(req.requestedByUser)}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {req.reviewedAt
                ? new Date(req.reviewedAt).toLocaleString()
                : new Date(req.createdAt).toLocaleString()}
            </span>
          </p>
          {req.reason && (
            <p className="mt-1 text-xs italic text-muted-foreground">
              “{req.reason}”
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <Badge
          variant={STATUS_VARIANT[req.status] ?? "secondary"}
          className="gap-1"
        >
          {approved ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {approved ? "Approved" : "Declined"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {approved ? "by" : "by"} {actorName(req.reviewedByUser, "—")}
        </span>
      </div>
    </div>
  );
}
