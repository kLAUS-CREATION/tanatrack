-- AlterTable
ALTER TABLE "purchase_item" ADD COLUMN     "returnedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "purchase_return" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "processedBy" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_item" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "purchaseItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,

    CONSTRAINT "purchase_return_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_return_organizationId_idx" ON "purchase_return"("organizationId");

-- CreateIndex
CREATE INDEX "purchase_return_purchaseId_idx" ON "purchase_return"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_return_item_returnId_idx" ON "purchase_return_item"("returnId");

-- CreateIndex
CREATE INDEX "purchase_return_item_purchaseItemId_idx" ON "purchase_return_item"("purchaseItemId");

-- AddForeignKey
ALTER TABLE "purchase_return" ADD CONSTRAINT "purchase_return_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return" ADD CONSTRAINT "purchase_return_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_item" ADD CONSTRAINT "purchase_return_item_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "purchase_return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_item" ADD CONSTRAINT "purchase_return_item_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "purchase_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
