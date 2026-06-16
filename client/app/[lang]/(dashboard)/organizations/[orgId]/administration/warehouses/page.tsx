"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
    useGetWarehousesQuery,
    useCreateWarehouseMutation,
    useUpdateWarehouseMutation,
    useDeleteWarehouseMutation,
    IWarehouse,
} from "@/lib/features/services/warehouse.api";
import { LocationHeader } from "@/components/dashboard/locations/location-header";
import { LocationView } from "@/components/dashboard/locations/view-toggle";
import { WarehouseList } from "@/components/dashboard/locations/warehouse-list";
import { WarehouseForm } from "@/components/dashboard/locations/warehouse-form";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export default function AdminWarehousesPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<IWarehouse | null>(null);
    const [view, setView] = useState<LocationView>("grid");
    const [ConfirmDialog, confirm] = useConfirm();

    const { data: warehouses, isLoading } = useGetWarehousesQuery(orgId);
    const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
    const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
    const [deleteWarehouse] = useDeleteWarehouseMutation();

    const handleCreate = async (data: any) => {
        try {
            await createWarehouse({ orgId: orgId, body: data }).unwrap();
            toast.success("Warehouse created successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create warehouse");
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingWarehouse) return;
        try {
            await updateWarehouse({
                orgId: orgId,
                warehouseId: editingWarehouse.id,
                body: data,
            }).unwrap();
            toast.success("Warehouse updated successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update warehouse");
        }
    };

    const handleDelete = async (warehouseId: string) => {
        const ok = await confirm({
            title: "Delete warehouse?",
            description:
                "This permanently removes the warehouse. This action cannot be undone.",
            confirmText: "Delete",
        });
        if (!ok) return;
        try {
            await deleteWarehouse({ orgId: orgId, warehouseId }).unwrap();
            toast.success("Warehouse deleted successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete warehouse");
        }
    };

    const openCreateForm = () => {
        setEditingWarehouse(null);
        setIsFormOpen(true);
    };

    const openEditForm = (warehouse: IWarehouse) => {
        setEditingWarehouse(warehouse);
        setIsFormOpen(true);
    };

    return (
        <div className="w-full mx-auto h-full">
            <LocationHeader
                title="Warehouses"
                description="Create, edit and remove your storage facilities."
                buttonText="Add Warehouse"
                onAdd={openCreateForm}
                view={view}
                onViewChange={setView}
            />

            <WarehouseList
                warehouses={warehouses}
                isLoading={isLoading}
                view={view}
                onEdit={openEditForm}
                onDelete={handleDelete}
            />

            <WarehouseForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingWarehouse ? handleUpdate : handleCreate}
                initialData={editingWarehouse}
                isLoading={isCreating || isUpdating}
            />
            {ConfirmDialog}
        </div>
    );
}
