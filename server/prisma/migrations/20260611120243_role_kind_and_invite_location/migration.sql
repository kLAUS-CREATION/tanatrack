-- CreateEnum
CREATE TYPE "RoleKind" AS ENUM ('GLOBAL', 'LOCAL');

-- AlterTable
ALTER TABLE "invite" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "kind" "RoleKind" NOT NULL DEFAULT 'GLOBAL';
