"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";

/** A single applied filter, surfaced as a removable chip in the toolbar. */
export interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  /** Removable chips for the currently-applied (non-search) filters. */
  chips: ActiveChip[];
  /** Clears every filter, including search. */
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
  /** The filter fields, rendered inside the dialog body. */
  children: React.ReactNode;
}

export function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  chips,
  onClearAll,
  resultCount,
  totalCount,
  children,
}: FilterToolbarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = chips.length;
  const isFiltered = activeCount > 0 || search.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-lg">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1.5 text-xs"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-105">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">{children}</div>
            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={onClearAll}
                disabled={!isFiltered}
              >
                Clear all
              </Button>
              <Button onClick={() => setOpen(false)} className="rounded-lg">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(chips.length > 0 || isFiltered) && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1 rounded-full py-1 pl-2.5 pr-1 font-normal"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-full p-0.5 hover:bg-foreground/10"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            Showing {resultCount} of {totalCount}
          </span>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={onClearAll}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
