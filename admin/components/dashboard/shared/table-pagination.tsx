"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Compact Prev/Next pager shown under a list table. Renders nothing when the
 * data fits on a single page.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-1 py-2 text-sm text-muted-foreground">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
