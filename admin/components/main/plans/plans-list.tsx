import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { IPlan, PlanType } from "@/types/plans";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Settings2, Trash2 } from "lucide-react";
import { useDeletePlanMutation } from "@/lib/features/services/plans.api";

export const columns: ColumnDef<IPlan>[] = [
  {
    accessorKey: "name",
    header: "Plan Details",
    cell: ({ row }) => (
      <div>
        <div className="font-bold">{row.original.name}</div>
        <div className="text-xs text-muted-foreground italic">/{row.original.slug}</div>
      </div>
    )
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === PlanType.PRO ? "default" : "secondary"}>
        {row.original.type}
      </Badge>
    )
  },
  {
    header: "Pricing",
    cell: ({ row }) => (
      <div className="text-sm">
        <span className="font-semibold">{row.original.currency} {row.original.monthlyPrice}</span>
        <span className="text-muted-foreground text-xs"> /mo</span>
      </div>
    )
  },
  {
    header: "Status",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.isActive ? <Badge className="bg-green-500/10 text-green-600 border-green-200">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
        {row.original.isPublic && <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">Public</Badge>}
      </div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => <PlanActions plan={row.original} />
  }
];

function PlanActions({ plan }: { plan: IPlan }) {
  const [deletePlan] = useDeletePlanMutation();
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="h-4 w-4" /></Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => { if(confirm("Are you sure?")) deletePlan(plan.id) }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlanTable({ data }: { data: IPlan[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="rounded-xs border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-background2">
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(h => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="bg-transparent">
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(c => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
