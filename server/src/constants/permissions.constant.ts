/**
 * Central registry of permission slugs.
 * Slug format: `${FeatureCategory}_${ACTION}` — must match prisma/seed.ts.
 * Use these constants instead of magic strings in services.
 */
export const PERMISSIONS = {
  // ADMINISTRATION — single umbrella permission gating the whole admin surface
  // (branch/warehouse CRUD, member invites, role management). OWNER bypasses it.
  // Organization-level settings (org info, plan upgrade) stay OWNER-only and are
  // NOT covered by this permission.
  ADMINISTRATION_ACCESS: 'ADMINISTRATION_ACCESS', // GLOBAL

  // BRANCHES (read)
  BRANCHES_LIST_ALL: 'BRANCHES_LIST_ALL', // GLOBAL
  BRANCHES_VIEW_DETAILS: 'BRANCHES_VIEW_DETAILS', // LOCAL

  // WAREHOUSING (read)
  WAREHOUSING_LIST_ALL: 'WAREHOUSING_LIST_ALL', // GLOBAL
  WAREHOUSING_VIEW_DETAILS: 'WAREHOUSING_VIEW_DETAILS', // LOCAL

  // SALES
  SALES_CREATE: 'SALES_CREATE', // LOCAL
  SALES_VIEW_BRANCH: 'SALES_VIEW_BRANCH', // LOCAL
  SALES_VIEW_ALL: 'SALES_VIEW_ALL', // GLOBAL

  // PRODUCTS / INVENTORY
  PRODUCTS_VIEW_ALL: 'PRODUCTS_VIEW_ALL', // GLOBAL
  PRODUCTS_MANAGE: 'PRODUCTS_MANAGE', // GLOBAL — create/update/delete products & variants
  PRODUCTS_MANAGE_CATEGORIES: 'PRODUCTS_MANAGE_CATEGORIES', // GLOBAL
  INVENTORY_VIEW_GLOBAL_STOCK: 'INVENTORY_VIEW_GLOBAL_STOCK', // GLOBAL
  INVENTORY_MANAGE: 'INVENTORY_MANAGE', // GLOBAL — allocate received (pool) stock to locations (maker-checker)
  INVENTORY_ADJUST_STOCK: 'INVENTORY_ADJUST_STOCK', // LOCAL
  INVENTORY_PURCHASE_IN: 'INVENTORY_PURCHASE_IN', // LOCAL — receive new stock
  INVENTORY_TRANSFER_STOCK: 'INVENTORY_TRANSFER_STOCK', // LOCAL — move stock between locations
  INVENTORY_VIEW_BRANCH_STOCK: 'INVENTORY_VIEW_BRANCH_STOCK', // LOCAL

  // REPORTS
  REPORTS_VIEW_ALL_BRANCHES: 'REPORTS_VIEW_ALL_BRANCHES', // GLOBAL
  REPORTS_VIEW_BRANCH: 'REPORTS_VIEW_BRANCH', // LOCAL

  // CUSTOMERS (org-wide reference data)
  CUSTOMERS_VIEW_ALL: 'CUSTOMERS_VIEW_ALL', // GLOBAL
  CUSTOMERS_MANAGE: 'CUSTOMERS_MANAGE', // GLOBAL

  // SUPPLIERS (org-wide reference data)
  SUPPLIERS_VIEW_ALL: 'SUPPLIERS_VIEW_ALL', // GLOBAL
  SUPPLIERS_MANAGE: 'SUPPLIERS_MANAGE', // GLOBAL

  // PURCHASES — recording stock received (maker-checker via change requests)
  PURCHASE_MANAGE: 'PURCHASE_MANAGE', // GLOBAL — record purchases (queued unless approver)
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
