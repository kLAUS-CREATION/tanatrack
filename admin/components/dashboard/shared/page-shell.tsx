"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./table-skeleton";

interface PageShellProps {
  title: string;
  subtitle?: string;
  /** Action controls rendered on the right of the header (buttons, etc.). */
  actions?: React.ReactNode;
  /**
   * How many action-button placeholders to show in the loading header so the
   * skeleton matches the real button row. Defaults to 1; pass 0 to hide.
   */
  actionCount?: number;
  /** Optional content between the header and the body (banners, queues). */
  banner?: React.ReactNode;

  loading?: boolean;
  empty?: boolean;
  /** Rendered when `empty` is true — typically an <EmptyState />. */
  emptyState?: React.ReactNode;

  /** Override the default loading skeleton (defaults to a <TableSkeleton />). */
  skeleton?: React.ReactNode;
  skeletonCols?: number;
  skeletonRows?: number;

  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared shell for list pages. Renders a consistent header (title + subtitle +
 * actions) and a body that switches between a full-page skeleton, a full-page
 * empty state, and the real content — so loading and zero-data look identical
 * across every page.
 */
export function PageShell({
  title,
  subtitle,
  actions,
  actionCount = 1,
  banner,
  loading = false,
  empty = false,
  emptyState,
  skeleton,
  skeletonCols = 5,
  skeletonRows = 8,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("flex w-full mx-auto min-h-full flex-col", className)}>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {loading ? (
          <>
            <div className="space-y-2">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-72" />
            </div>
            {actionCount > 0 && (
              <div className="flex items-center gap-2">
                {Array.from({ length: actionCount }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-32 rounded-sm" />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </>
        )}
      </div>

      {!loading && banner}

      <div className="flex flex-1 flex-col">
        {loading
          ? skeleton ?? (
              <TableSkeleton cols={skeletonCols} rows={skeletonRows} />
            )
          : empty
            ? emptyState
            : children}
      </div>
    </div>
  );
}
