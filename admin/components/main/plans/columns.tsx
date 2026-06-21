import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  onDelete: (plan: IPlan) => void,
): ColumnDef<IPlan>[] => [
  {
    accessorKey: "name",
    header: "Plan",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.slug}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === PlanType.PRO ? "default" : "secondary"}
      >
        {row.original.type === PlanType.PRO ? "Paid" : "Free"}
      </Badge>
    ),
  },
  {
    accessorKey: "monthlyPrice",
    header: "Monthly",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.monthlyPrice
          ? `${row.original.currency} ${(
              row.original.monthlyPrice / 100
            ).toLocaleString()}`
          : "Free"}
      </span>
    ),
  },
  {
    id: "features",
    header: "Features",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.original.planFeatures?.length ?? 0}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant="secondary"
          className={cn(
            "text-xs",
            row.original.isActive
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground",
          )}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
        {row.original.isPublic && (
          <Badge variant="outline" className="text-xs">
            Public
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSync(plan)}>
                <ListChecks className="mr-2 h-4 w-4" /> Manage features
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(plan)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
