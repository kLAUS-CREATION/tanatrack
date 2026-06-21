"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreatePlanForm } from "./create-plans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlanDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create plan</DialogTitle>
          <DialogDescription>
            Define a new pricing tier. You can attach features now or later via
            “Manage features”.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="px-1">
            <CreatePlanForm onSuccess={() => onOpenChange(false)} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
