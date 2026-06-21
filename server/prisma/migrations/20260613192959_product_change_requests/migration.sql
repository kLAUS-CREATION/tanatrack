-- CreateEnum
CREATE TYPE "ProductChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductChangeEntity" AS ENUM ('PRODUCT', 'VARIANT', 'CATEGORY');

-- CreateEnum
CREATE TYPE "ProductChangeOp" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "product_change_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entity" "ProductChangeEntity" NOT NULL,
    "operation" "ProductChangeOp" NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "categoryId" TEXT,
    "payload" JSONB,
    "status" "ProductChangeStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reason" TEXT,
    "appliedRefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_change_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_change_request_organizationId_status_idx" ON "product_change_request"("organizationId", "status");

-- CreateIndex
CREATE INDEX "product_change_request_requestedBy_idx" ON "product_change_request"("requestedBy");

-- AddForeignKey
ALTER TABLE "product_change_request" ADD CONSTRAINT "product_change_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
