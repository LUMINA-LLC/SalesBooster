-- CreateEnum
CREATE TYPE "TargetPeriodType" AS ENUM ('MONTHLY', 'WEEKLY', 'DAILY');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'TARGET_BULK_UPSERT';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_TARGET_UPSERT';

-- Migrate Target: rename monthly -> value, drop quarterly/annual, add periodType
ALTER TABLE "Target" RENAME COLUMN "monthly" TO "value";
ALTER TABLE "Target" DROP COLUMN "quarterly";
ALTER TABLE "Target" DROP COLUMN "annual";
ALTER TABLE "Target" ADD COLUMN "periodType" "TargetPeriodType" NOT NULL DEFAULT 'MONTHLY';

-- Drop old unique constraint and create new one
ALTER TABLE "Target" DROP CONSTRAINT "Target_tenantId_userId_year_month_dataTypeId_key";
CREATE UNIQUE INDEX "Target_tenantId_userId_year_month_periodType_dataTypeId_key" ON "Target"("tenantId", "userId", "year", "month", "periodType", "dataTypeId");

-- CreateTable
CREATE TABLE "GroupTarget" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodType" "TargetPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "dataTypeId" INTEGER,
    "tenantId" INTEGER NOT NULL,

    CONSTRAINT "GroupTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupTarget_tenantId_groupId_year_month_periodType_dataType_key" ON "GroupTarget"("tenantId", "groupId", "year", "month", "periodType", "dataTypeId");
CREATE INDEX "GroupTarget_tenantId_idx" ON "GroupTarget"("tenantId");
CREATE INDEX "GroupTarget_dataTypeId_idx" ON "GroupTarget"("dataTypeId");

-- AddForeignKey
ALTER TABLE "GroupTarget" ADD CONSTRAINT "GroupTarget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupTarget" ADD CONSTRAINT "GroupTarget_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupTarget" ADD CONSTRAINT "GroupTarget_dataTypeId_fkey" FOREIGN KEY ("dataTypeId") REFERENCES "DataType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Set default for Target.value
ALTER TABLE "Target" ALTER COLUMN "value" SET DEFAULT 0;
