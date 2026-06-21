/*
  Warnings:

  - You are about to drop the column `branchId` on the `invite` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `invite` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invite" DROP COLUMN "branchId",
DROP COLUMN "warehouseId";

-- CreateTable
CREATE TABLE "invite_location" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "branchId" TEXT,
    "warehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invite_location_inviteId_idx" ON "invite_location"("inviteId");

-- AddForeignKey
ALTER TABLE "invite_location" ADD CONSTRAINT "invite_location_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_location" ADD CONSTRAINT "invite_location_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_location" ADD CONSTRAINT "invite_location_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
