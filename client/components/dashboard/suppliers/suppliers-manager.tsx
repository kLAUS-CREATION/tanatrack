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
import { Truck, Plus, Edit, Trash2, Mail, Phone, Clock } from "lucide-react";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { isPendingChange } from "@/lib/features/services/change-request.api";
import {
  ISupplier,
  CreateSupplierRequest,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "@/lib/features/services/supplier.api";
import { SupplierForm } from "@/components/dashboard/suppliers/supplier-form";

const SUPPLIERS_MANAGE = "SUPPLIERS_MANAGE";

export function SuppliersManager() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  // Admins (ADMINISTRATION_ACCESS) and SUPPLIERS_MANAGE holders can both manage
  // suppliers; admins apply instantly, makers' changes go to the approval queue.
  const canManage =
    isOwner || canAdminister || permissions.includes(SUPPLIERS_MANAGE);
  const needsApproval = canManage && !canAdminister;

  const { data: suppliers, isLoading } = useGetSuppliersQuery(orgId);
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ISupplier | null>(null);
  const [ConfirmDialog, confirm] = useConfirm();

  const handleSubmit = async (data: CreateSupplierRequest) => {
    try {
      if (editing) {
        const res = await updateSupplier({
          orgId,
          supplierId: editing.id,
          body: data,
        }).unwrap();
        toast.success(
          isPendingChange(res) ? "Update submitted for approval" : "Supplier updated",
        );
      } else {
        const res = await createSupplier({ orgId, body: data }).unwrap();
        toast.success(
          isPendingChange(res)
            ? "Supplier submitted for approval"
            : "Supplier created",
        );
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save supplier");
    }
  };

  const handleDelete = async (supplier: ISupplier) => {
    const ok = await confirm({
      title: needsApproval ? "Request supplier deletion?" : "Delete supplier?",
      description: needsApproval
        ? `This sends a request to delete "${supplier.name}" to an administrator for approval.`
        : `This permanently removes "${supplier.name}". Past purchases keep their record but will no longer link to this supplier.`,
      confirmText: needsApproval ? "Submit request" : "Delete",
    });
    if (!ok) return;
    try {
      const res = await deleteSupplier({ orgId, supplierId: supplier.id }).unwrap();
      toast.success(
        isPendingChange(res) ? "Deletion submitted for approval" : "Supplier deleted",
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete supplier");
    }
  };

  return (
    <>
      <PageShell
        title="Suppliers"
        subtitle="The suppliers your organization purchases stock from."
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
              <Plus className="h-4 w-4" /> Add Supplier
            </Button>
          )
        }
        banner={
          /* Makers: heads-up that their changes route through the approval queue. */
          needsApproval && (
            <div className="mb-6 flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Your supplier changes are submitted for approval by an
                administrator before they take effect.
              </span>
            </div>
          )
        }
        loading={isLoading}
        empty={!suppliers || suppliers.length === 0}
        skeletonCols={canManage ? 6 : 5}
        emptyState={
          <EmptyState
            icon={Truck}
            title="No suppliers yet"
            description={
              canManage
                ? "Add your first supplier to attach them to purchases."
                : "No suppliers have been added yet."
            }
          />
        }
      >
        <div className="rounded-sm border border-border bg-background2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.contactPerson || "—"}</TableCell>
                  <TableCell>
                    {s.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {s.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.email}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? "Active" : "Inactive"}
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
                            setEditing(s);
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
                          onClick={() => handleDelete(s)}
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
        <SupplierForm
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
