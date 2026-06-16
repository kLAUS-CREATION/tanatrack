"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
    useGetWarehousesQuery,
} from "@/lib/features/services/warehouse.api";
import { LocationHeader } from "@/components/dashboard/locations/location-header";
import { LocationView } from "@/components/dashboard/locations/view-toggle";
import { WarehouseList } from "@/components/dashboard/locations/warehouse-list";

export default function WarehousesPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [view, setView] = useState<LocationView>("grid");

    const { data: warehouses, isLoading } = useGetWarehousesQuery(orgId);

    return (
        <div className="w-full mx-auto h-full">
            <LocationHeader
                title="Warehouses"
                description="Your storage facilities and stock containers."
                view={view}
                onViewChange={setView}
            />

            <WarehouseList
                warehouses={warehouses}
                isLoading={isLoading}
                view={view}
            />
        </div>
    );
}
