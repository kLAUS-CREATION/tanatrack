-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MovementType" ADD VALUE 'SALE_RETURN';
ALTER TYPE "MovementType" ADD VALUE 'PURCHASE_RETURN';

-- DropIndex
DROP INDEX "stock_level_variant_pool_key";

-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sale" ADD COLUMN     "amountPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "refundedTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tax" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sale_item" ADD COLUMN     "returnedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sale_return" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "processedBy" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_return_item" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,

    CONSTRAINT "sale_return_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_return_organizationId_idx" ON "sale_return"("organizationId");

-- CreateIndex
CREATE INDEX "sale_return_saleId_idx" ON "sale_return"("saleId");

-- CreateIndex
CREATE INDEX "sale_return_item_returnId_idx" ON "sale_return_item"("returnId");

-- CreateIndex
CREATE INDEX "sale_return_item_saleItemId_idx" ON "sale_return_item"("saleItemId");

-- AddForeignKey
ALTER TABLE "sale_return" ADD CONSTRAINT "sale_return_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return" ADD CONSTRAINT "sale_return_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_item" ADD CONSTRAINT "sale_return_item_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "sale_return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_item" ADD CONSTRAINT "sale_return_item_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
