"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { IPlan } from "@/types/plans";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns } from "./columns";

interface PlanTableProps {
  data: IPlan[];
  onEdit: (plan: IPlan) => void;
  onSync: (plan: IPlan) => void;
  onDelete: (plan: IPlan) => void;
}

export function PlanTable({ data, onEdit, onSync, onDelete }: PlanTableProps) {
  const cols = columns(onEdit, onSync, onDelete);
  const table = useReactTable({
    data,
    columns: cols,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-sm border border-border bg-background2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((c) => (
                  <TableCell key={c.id}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={cols.length}
                className="h-24 text-center text-muted-foreground"
              >
                No matching plans.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
