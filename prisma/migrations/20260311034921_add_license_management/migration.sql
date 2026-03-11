-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TRIAL', 'STANDARD', 'ENTERPRISE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_EXPIRE';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "licenseEndDate" TIMESTAMP(3),
ADD COLUMN     "licenseStartDate" TIMESTAMP(3),
ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "planType" "PlanType";

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "planType" "PlanType",
    "maxMembers" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionHistory_tenantId_idx" ON "SubscriptionHistory"("tenantId");

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

