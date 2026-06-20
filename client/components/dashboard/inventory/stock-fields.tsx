"use client";

import React from "react";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { IProduct } from "@/lib/features/services/product.api";
import { IBranch } from "@/lib/features/services/branch.api";
import { IWarehouse } from "@/lib/features/services/warehouse.api";
import { LocationInput } from "@/lib/features/services/inventory.api";

// Shared field helpers for the inventory stock-move dialogs (allocate, transfer).

// Encode/decode a location as `branch:<id>` | `warehouse:<id>` for the picker.
export function decodeLocation(value: string): LocationInput {
  const [kind, id] = value.split(":");
  return kind === "branch" ? { branchId: id } : { warehouseId: id };
}

// Grouped combobox options for branches + warehouses (values match decodeLocation).
export function locationOptions(
  branches: IBranch[],
  warehouses: IWarehouse[],
): ComboboxOption[] {
  return [
    ...branches.map((b) => ({
      value: `branch:${b.id}`,
      label: b.name,
      group: "Branches",
    })),
    ...warehouses.map((w) => ({
      value: `warehouse:${w.id}`,
      label: w.name,
      group: "Warehouses",
    })),
  ];
}

// Searchable branch/warehouse picker. Value is `branch:<id>` | `warehouse:<id>`.
export function LocationCombobox({
  branches,
  warehouses,
  value,
  onChange,
  placeholder = "Select a location",
  disabled,
  className,
}: {
  branches: IBranch[];
  warehouses: IWarehouse[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Combobox
      options={locationOptions(branches, warehouses)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search locations…"
      emptyText="No locations found."
      disabled={disabled}
      className={className}
    />
  );
}

// Searchable product-variant picker options (label + SKU/name keywords).
export function variantOptions(products: IProduct[]): ComboboxOption[] {
  return products.flatMap((p) =>
    (p.variants ?? []).map((v) => ({
      value: v.id,
      label: `${p.name} — ${v.name} (${v.sku})`,
      keywords: [p.name, v.name, v.sku],
    })),
  );
}
