"use client";

import React from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type LocationView = "grid" | "table";

interface ViewToggleProps {
    view: LocationView;
    onViewChange: (view: LocationView) => void;
}

const OPTIONS: { value: LocationView; label: string; Icon: typeof LayoutGrid }[] = [
    { value: "grid", label: "Grid view", Icon: LayoutGrid },
    { value: "table", label: "Table view", Icon: List },
];

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="inline-flex items-center rounded-sm border border-border p-0.5">
            {OPTIONS.map(({ value, label, Icon }) => {
                const active = view === value;
                return (
                    <button
                        key={value}
                        type="button"
                        aria-label={label}
                        aria-pressed={active}
                        onClick={() => onViewChange(value)}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xs transition-colors",
                            active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                );
            })}
        </div>
    );
}
