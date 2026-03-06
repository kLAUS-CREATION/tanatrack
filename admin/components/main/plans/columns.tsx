import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, RefreshCw, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { IPlan, PlanType } from "@/types/plans";

export const columns = (
  onEdit: (plan: IPlan) => void,
  onSync: (plan: IPlan) => void,
  onDelete: (id: string) => void
): ColumnDef<IPlan>[] => [
  {
    accessorKey: "name",
    header: "Plan Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.slug}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === PlanType.PRO ? "default" : "secondary"}>
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "monthlyPrice",
    header: "Pricing (Monthly)",
    cell: ({ row }) => (
      <span>
        {row.original.monthlyPrice
          ? `${row.original.currency} ${row.original.monthlyPrice / 100}`
          : "Free"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex gap-2">
        {row.original.isActive ? (
          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        )}
        {row.original.isPublic && (
          <Badge variant="outline" className="text-blue-600 border-blue-600">Public</Badge>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(plan)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSync(plan)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Manage Features
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(plan.id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
