-- DropIndex
DROP INDEX "stock_level_variant_branch_key";

-- DropIndex
DROP INDEX "stock_level_variant_warehouse_key";

-- CreateTable
CREATE TABLE "purchase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "warehouseId" TEXT,
    "supplierName" TEXT,
    "reference" TEXT,
    "receivedBy" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_item" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,

    CONSTRAINT "purchase_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_organizationId_idx" ON "purchase"("organizationId");

-- CreateIndex
CREATE INDEX "purchase_createdAt_idx" ON "purchase"("createdAt");

-- CreateIndex
CREATE INDEX "purchase_item_purchaseId_idx" ON "purchase_item"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_item_variantId_idx" ON "purchase_item"("variantId");

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
