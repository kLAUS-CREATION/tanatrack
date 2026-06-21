-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUESTED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'LOW_STOCK', 'SALE_RECORDED', 'MEMBER_JOINED', 'ROLE_CHANGED');

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushOnApproval" BOOLEAN NOT NULL DEFAULT true,
    "pushOnLowStock" BOOLEAN NOT NULL DEFAULT true,
    "pushOnSale" BOOLEAN NOT NULL DEFAULT true,
    "pushOnMembership" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_isRead_idx" ON "notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_key" ON "notification_preference"("userId");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
