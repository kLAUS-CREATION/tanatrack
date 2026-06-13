"use client";

import React from "react";
import { IWarehouse } from "@/lib/features/services/warehouse.api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, MapPin, Warehouse as WarehouseIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationView } from "./view-toggle";

interface WarehouseListProps {
    warehouses?: IWarehouse[];
    isLoading: boolean;
    view?: LocationView;
    onEdit?: (warehouse: IWarehouse) => void;
    onDelete?: (id: string) => void;
}

export function WarehouseList({
    warehouses,
    isLoading,
    view = "grid",
    onEdit,
    onDelete,
}: WarehouseListProps) {
    const showActions = Boolean(onEdit || onDelete);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (!warehouses || warehouses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <WarehouseIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No warehouses found</h3>
                <p className="text-muted-foreground">Get started by creating your first warehouse.</p>
            </div>
        );
    }

    if (view === "table") {
        return (
            <div className="rounded-sm border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            {showActions && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {warehouses.map((warehouse) => (
                            <TableRow key={warehouse.id}>
                                <TableCell>
                                    <Badge variant="outline" className="bg-background font-mono">
                                        {warehouse.code || "WH-NO-CODE"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold">{warehouse.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{warehouse.address || "—"}</TableCell>
                                {showActions && (
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            {onEdit && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(warehouse)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(warehouse.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => (
                <Card key={warehouse.id} className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300">
                    <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex justify-between items-start">
                            <Badge variant="outline" className="bg-background font-mono">
                                {warehouse.code || "WH-NO-CODE"}
                            </Badge>
                            {showActions && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(warehouse)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(warehouse.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <CardTitle className="text-xl mt-2">{warehouse.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {warehouse.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{warehouse.address}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
