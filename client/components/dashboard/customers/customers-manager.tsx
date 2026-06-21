"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { FilterToolbar, type ActiveChip } from "@/components/dashboard/shared/filter-toolbar";
import { TablePagination } from "@/components/dashboard/shared/table-pagination";
import { Users, Plus, Edit, Trash2, Mail, Phone, FilterX } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import {
  ICustomer,
  CreateCustomerRequest,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/lib/features/services/customer.api";
import { CustomerForm } from "@/components/dashboard/customers/customer-form";

const CUSTOMERS_MANAGE = "CUSTOMERS_MANAGE";

const ALL = "__all__";
type StatusFilter = typeof ALL | "active" | "inactive";

export function CustomersManager() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  const canManage =
    isOwner || canAdminister || permissions.includes(CUSTOMERS_MANAGE);

  const { data: customers, isLoading } = useGetCustomersQuery(orgId);
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ICustomer | null>(null);
  const [ConfirmDialog, confirm] = useConfirm();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(ALL);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  React.useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (customers ?? []).filter((c) => {
      if (status !== ALL && c.isActive !== (status === "active")) return false;
      if (q) {
        const hay = [c.name, c.phone, c.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customers, search, status]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const chips: ActiveChip[] = [];
  if (status !== ALL)
    chips.push({
      key: "status",
      label: status === "active" ? "Active" : "Inactive",
      onRemove: () => setStatus(ALL),
    });

  const clearAll = () => {
    setSearch("");
    setStatus(ALL);
  };

  const handleSubmit = async (data: CreateCustomerRequest) => {
    try {
      if (editing) {
        await updateCustomer({
          orgId,
          customerId: editing.id,
          body: data,
        }).unwrap();
        toast.success("Customer updated");
      } else {
        await createCustomer({ orgId, body: data }).unwrap();
        toast.success("Customer created");
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save customer");
    }
  };

  const handleDelete = async (customer: ICustomer) => {
    const ok = await confirm({
      title: "Delete customer?",
      description: `This permanently removes "${customer.name}". Past sales keep their record but will no longer link to this customer.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await deleteCustomer({ orgId, customerId: customer.id }).unwrap();
      toast.success("Customer deleted");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete customer");
    }
  };

  return (
    <>
      <PageShell
        title="Customers"
        subtitle="The customers your organization sells to."
        actionCount={canManage ? 1 : 0}
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setIsFormOpen(true);
              }}
              className="gap-2 rounded-sm"
            >
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )
        }
        loading={isLoading}
        empty={!customers || customers.length === 0}
        skeletonCols={canManage ? 5 : 4}
        emptyState={
          <EmptyState
            icon={Users}
            title="No customers yet"
            description={
              canManage
                ? "Add your first customer to attach them to sales."
                : "No customers have been added yet."
            }
          />
        }
      >
        <div className="space-y-4">
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, phone or email…"
            chips={chips}
            onClearAll={clearAll}
            resultCount={filtered.length}
            totalCount={customers?.length ?? 0}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as StatusFilter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterToolbar>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-sm text-center">
              <FilterX className="h-8 w-8 mb-3 text-muted-foreground/60" />
              <p className="font-medium">No matches</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting or clearing your filters.
              </p>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-background2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    {c.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {c.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.email}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.balance > 0 ? (
                      <span className="font-medium text-amber-600">
                        {formatMoney(c.balance)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatMoney(0)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          onClick={() => {
                            setEditing(c);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          title="Delete"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </PageShell>

      {canManage && (
        <CustomerForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          initialData={editing}
          isLoading={isCreating || isUpdating}
        />
      )}
      {ConfirmDialog}
    </>
  );
}
