"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
    useGetBranchesQuery,
} from "@/lib/features/services/branch.api";
import { LocationHeader } from "@/components/dashboard/locations/location-header";
import { LocationView } from "@/components/dashboard/locations/view-toggle";
import { BranchList } from "@/components/dashboard/locations/branch-list";

export default function BranchesPage() {
    const params = useParams();
    const dashboardId = params.dashboardId as string;

    const [view, setView] = useState<LocationView>("grid");

    const { data: branches, isLoading } = useGetBranchesQuery(dashboardId);

    return (
        <div className="w-full mx-auto min-h-full">
            <LocationHeader
                title="Branches"
                description="Your business locations and retail points."
                view={view}
                onViewChange={setView}
            />

            <BranchList
                branches={branches}
                isLoading={isLoading}
                view={view}
            />
        </div>
    );
}
