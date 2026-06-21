import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Number of columns — match the real table so the skeleton lines up. */
  cols?: number;
  /** Number of placeholder rows (enough to fill the page). */
  rows?: number;
  className?: string;
}

/**
 * Skeleton that mirrors the real list tables: a bordered container with a
 * header row and several body rows, so the loading state matches the layout
 * that replaces it.
 */
export function TableSkeleton({ cols = 5, rows = 8, className }: TableSkeletonProps) {
  return (
    <div className={cn("rounded-sm border border-border bg-background2", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-3.5 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-16")} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface CardGridSkeletonProps {
  /** Number of placeholder cards. */
  count?: number;
  /** Card height — matches the real cards. */
  itemClassName?: string;
  className?: string;
}

/**
 * Skeleton for the card/grid list views.
 */
export function CardGridSkeleton({
  count = 6,
  itemClassName = "h-[180px]",
  className,
}: CardGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-xl", itemClassName)} />
      ))}
    </div>
  );
}
