"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
    useGetBranchesQuery,
    useCreateBranchMutation,
    useUpdateBranchMutation,
    useDeleteBranchMutation,
    IBranch,
} from "@/lib/features/services/branch.api";
import { LocationHeader } from "@/components/dashboard/locations/location-header";
import { LocationView } from "@/components/dashboard/locations/view-toggle";
import { BranchList } from "@/components/dashboard/locations/branch-list";
import { BranchForm } from "@/components/dashboard/locations/branch-form";
import { toast } from "sonner";

export default function AdminBranchesPage() {
    const params = useParams();
    const dashboardId = params.dashboardId as string;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<IBranch | null>(null);
    const [view, setView] = useState<LocationView>("grid");

    const { data: branches, isLoading } = useGetBranchesQuery(dashboardId);
    const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
    const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
    const [deleteBranch] = useDeleteBranchMutation();

    const handleCreate = async (data: any) => {
        try {
            await createBranch({ orgId: dashboardId, body: data }).unwrap();
            toast.success("Branch created successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create branch");
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingBranch) return;
        try {
            await updateBranch({
                orgId: dashboardId,
                branchId: editingBranch.id,
                body: data,
            }).unwrap();
            toast.success("Branch updated successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update branch");
        }
    };

    const handleDelete = async (branchId: string) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            try {
                await deleteBranch({ orgId: dashboardId, branchId }).unwrap();
                toast.success("Branch deleted successfully");
            } catch (error: any) {
                toast.error(error?.data?.message || "Failed to delete branch");
            }
        }
    };

    const openCreateForm = () => {
        setEditingBranch(null);
        setIsFormOpen(true);
    };

    const openEditForm = (branch: IBranch) => {
        setEditingBranch(branch);
        setIsFormOpen(true);
    };

    return (
        <div className="w-full mx-auto min-h-full">
            <LocationHeader
                title="Branches"
                description="Create, edit and remove your business locations."
                buttonText="Add Branch"
                onAdd={openCreateForm}
                view={view}
                onViewChange={setView}
            />

            <BranchList
                branches={branches}
                isLoading={isLoading}
                view={view}
                onEdit={openEditForm}
                onDelete={handleDelete}
            />

            <BranchForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingBranch ? handleUpdate : handleCreate}
                initialData={editingBranch}
                isLoading={isCreating || isUpdating}
            />
        </div>
    );
}
