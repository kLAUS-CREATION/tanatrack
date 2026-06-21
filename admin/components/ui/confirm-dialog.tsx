"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmTone = "destructive" | "default";

interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

/**
 * Promise-based confirmation dialog — a drop-in replacement for the native
 * `window.confirm()`. Returns `[dialog, confirm]`: render `dialog` once in the
 * component tree, then `await confirm({ ... })` wherever you need a yes/no.
 *
 *   const [ConfirmDialog, confirm] = useConfirm();
 *   ...
 *   if (!(await confirm({ title: "Delete?" }))) return;
 *   ...
 *   return <>{ConfirmDialog} ...</>;
 */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolver = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = React.useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  const tone = options?.tone ?? "destructive";

  const dialog = (
    <Dialog
      open={!!options}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                tone === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5 pt-1 text-left">
              <DialogTitle>{options?.title}</DialogTitle>
              {options?.description && (
                <DialogDescription>{options.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => settle(false)}>
            {options?.cancelText ?? "Cancel"}
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={() => settle(true)}
            autoFocus
          >
            {options?.confirmText ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [dialog, confirm] as const;
}
