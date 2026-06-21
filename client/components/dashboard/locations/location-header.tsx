"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ViewToggle, LocationView } from "./view-toggle";

interface LocationHeaderProps {
    title: string;
    description: string;
    onAdd?: () => void;
    buttonText?: string;
    view?: LocationView;
    onViewChange?: (view: LocationView) => void;
}

export function LocationHeader({
    title,
    description,
    onAdd,
    buttonText,
    view,
    onViewChange,
}: LocationHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                {view && onViewChange && (
                    <ViewToggle view={view} onViewChange={onViewChange} />
                )}
                {onAdd && buttonText && (
                    <Button onClick={onAdd} className="gap-2 rounded-sm">
                        {buttonText}
                    </Button>
                )}
            </div>
        </div>
    );
}
