"use client";

import React from "react";
import { IBranch } from "@/lib/features/services/branch.api";
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
import { Edit, Trash2, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { CardGridSkeleton, TableSkeleton } from "@/components/dashboard/shared/table-skeleton";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { cn } from "@/lib/utils";
import { LocationView } from "./view-toggle";

interface BranchListProps {
    branches?: IBranch[];
    isLoading: boolean;
    view?: LocationView;
    onEdit?: (branch: IBranch) => void;
    onDelete?: (id: string) => void;
}

export function BranchList({
    branches,
    isLoading,
    view = "grid",
    onEdit,
    onDelete,
}: BranchListProps) {
    const showActions = Boolean(onEdit || onDelete);

    if (isLoading) {
        return view === "table" ? (
            <TableSkeleton cols={showActions ? 7 : 6} />
        ) : (
            <CardGridSkeleton itemClassName="h-[200px]" />
        );
    }

    if (!branches || branches.length === 0) {
        return (
            <EmptyState
                icon={Building2}
                title="No branches found"
                description="Get started by creating your first branch."
            />
        );
    }

    if (view === "table") {
        return (
            <div className="rounded-sm border border-border bg-background2">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            {showActions && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell>
                                    <Badge variant="outline" className="bg-background font-mono">
                                        {branch.code || "NO-CODE"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold uppercase">{branch.name}</TableCell>
                                <TableCell className="text-sm uppercase text-muted-foreground">{branch.type}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {branch.address
                                        ? `${branch.address}${branch.city ? `, ${branch.city}` : ""}`
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{branch.phone || "—"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{branch.email || "—"}</TableCell>
                                {showActions && (
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            {onEdit && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(branch)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(branch.id)}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 cursor-pointer">
            {branches.map((branch) => (
                <div key={branch.id} className={cn(
                    "h-full p-2 lg:p-3 rounded-xs border-2 border-primary/80 transition-all duration-500 flex flex-col justify-between",
                    "bg-background2 border-border hover:border-primary/20 rounded-sm",
                  )}>
                    <div className="pb-2">
                        <div className="flex justify-between items-start">
                            <Badge variant="outline" className="bg-background font-mono">
                                {branch.code || "NO-CODE"}
                            </Badge>
                            {showActions && (
                                <div className="flex gap-1">
                                    {onEdit && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(branch)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(branch.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="text-lg xl:text-xl mt-2 uppercase font-bold">{branch.name}</div>
                        <span className="text-xs lg:text-sm uppercase">{branch.type}</span>
                    </div>
                    <div className="pt-4 space-y-3">
                        {branch.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{branch.address}{branch.city ? `, ${branch.city}` : ""}</span>
                            </div>
                        )}
                        {branch.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>{branch.phone}</span>
                            </div>
                        )}
                        {branch.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 text-primary" />
                                <span>{branch.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
