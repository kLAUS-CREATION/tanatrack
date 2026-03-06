/*
  Warnings:

  - Added the required column `type` to the `plan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PAID');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'ONFREETRIAL';

-- AlterTable
ALTER TABLE "invoice" ALTER COLUMN "currency" SET DEFAULT 'ETB';

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "timeZone" TEXT;

-- AlterTable
ALTER TABLE "plan" ADD COLUMN     "type" "PlanType" NOT NULL,
ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "hasFreeTrial" BOOLEAN NOT NULL DEFAULT true;
