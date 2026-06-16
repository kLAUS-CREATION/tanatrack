import {
  Package,
  Layers,
  FolderTree,
  Truck,
  ShoppingCart,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import type {
  ChangeEntity,
  IChangeActor,
  IChangeRequest,
} from "./services/change-request.api";

/** Per-entity icon for change-request rows (products, variants, … suppliers). */
const ENTITY_ICON: Record<ChangeEntity, LucideIcon> = {
  PRODUCT: Package,
  VARIANT: Layers,
  CATEGORY: FolderTree,
  SUPPLIER: Truck,
  PURCHASE: ShoppingCart,
  STOCK_MOVE: ArrowLeftRight,
};

export function changeEntityIcon(entity: ChangeEntity): LucideIcon {
  return ENTITY_ICON[entity] ?? Package;
}

/** Human-friendly entity label, e.g. "PRODUCT" → "Product". */
const ENTITY_LABEL: Record<ChangeEntity, string> = {
  PRODUCT: "Product",
  VARIANT: "Variant",
  CATEGORY: "Category",
  SUPPLIER: "Supplier",
  PURCHASE: "Purchase",
  STOCK_MOVE: "Stock move",
};

export function changeEntityLabel(entity: ChangeEntity): string {
  return ENTITY_LABEL[entity] ?? entity;
}

export const OP_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

export const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  APPROVED: "default",
  REJECTED: "destructive",
  PENDING: "secondary",
};

/** Human summary like: Create product “Red Shirt”, or Purchase from “Acme” · 3 items. */
export function describeChange(req: IChangeRequest): string {
  // Purchases have no name; summarise by supplier + line count instead.
  if (req.entity === "PURCHASE") {
    const items = Array.isArray(req.payload?.items)
      ? (req.payload!.items as unknown[]).length
      : 0;
    const supplier = (req.payload?.supplierName as string | undefined) ?? null;
    const who = supplier ? `Purchase from “${supplier}”` : "Purchase (unknown supplier)";
    return `${who} · ${items} item${items === 1 ? "" : "s"}`;
  }

  // Stock moves: allocate received (pool) stock to a location.
  if (req.entity === "STOCK_MOVE") {
    const qty = (req.payload?.quantity as number | undefined) ?? 0;
    const variant = (req.payload?.variantName as string | undefined) ?? "stock";
    const dest =
      (req.payload?.destinationName as string | undefined) ?? "a location";
    return `Move ${qty} × ${variant} → ${dest}`;
  }

  const entity = req.entity.toLowerCase();
  const op = req.operation.charAt(0) + req.operation.slice(1).toLowerCase();
  const name = (req.payload?.name as string | undefined) ?? null;
  return name ? `${op} ${entity} “${name}”` : `${op} ${entity}`;
}

/** Display name for a requester/reviewer, falling back to email then a label. */
export function actorName(
  actor: IChangeActor | null | undefined,
  fallback = "a member",
): string {
  return actor?.name ?? actor?.email ?? fallback;
}
