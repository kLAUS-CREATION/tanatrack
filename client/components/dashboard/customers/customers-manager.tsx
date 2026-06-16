"use client";

import React, { useState } from "react";
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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { Users, Plus, Edit, Trash2, Mail, Phone } from "lucide-react";
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
        <div className="rounded-sm border border-border bg-background2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((c) => (
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
