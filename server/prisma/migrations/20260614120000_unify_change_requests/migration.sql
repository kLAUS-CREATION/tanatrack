-- Generalize the product change-request system into a shared change-request
-- system (products, categories, suppliers, …). In-place renames preserve data.

-- Rename enums to generic names
ALTER TYPE "ProductChangeStatus" RENAME TO "ChangeStatus";
ALTER TYPE "ProductChangeEntity" RENAME TO "ChangeEntity";
ALTER TYPE "ProductChangeOp" RENAME TO "ChangeOp";

-- Add the SUPPLIER entity value
ALTER TYPE "ChangeEntity" ADD VALUE 'SUPPLIER';

-- Rename the table and add the supplier target column
ALTER TABLE "product_change_request" RENAME TO "change_request";
ALTER TABLE "change_request" ADD COLUMN "supplierId" TEXT;

-- Rename primary key, indexes and foreign key to match the new table name
ALTER TABLE "change_request" RENAME CONSTRAINT "product_change_request_pkey" TO "change_request_pkey";
ALTER INDEX "product_change_request_organizationId_status_idx" RENAME TO "change_request_organizationId_status_idx";
ALTER INDEX "product_change_request_requestedBy_idx" RENAME TO "change_request_requestedBy_idx";
ALTER TABLE "change_request" RENAME CONSTRAINT "product_change_request_organizationId_fkey" TO "change_request_organizationId_fkey";
