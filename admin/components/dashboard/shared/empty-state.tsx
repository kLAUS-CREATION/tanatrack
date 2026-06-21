import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon shown in the circle. */
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action (e.g. an "Add" button). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Full-page "no data" state, shared by every list page so the zero-state looks
 * identical everywhere. Grows to fill the available content height rather than
 * sitting in a small box at the top.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 min-h-[60vh] flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
