-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'EXPIRY_WRITE_OFF';

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "isPerishable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "purchase_item" ADD COLUMN     "expiryDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "stock_batch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "branchId" TEXT,
    "warehouseId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_batch_organizationId_idx" ON "stock_batch"("organizationId");

-- CreateIndex
CREATE INDEX "stock_batch_variantId_branchId_warehouseId_expiryDate_idx" ON "stock_batch"("variantId", "branchId", "warehouseId", "expiryDate");

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
