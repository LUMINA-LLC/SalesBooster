-- AlterTable
ALTER TABLE "Target" ALTER COLUMN "value" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "GroupTarget_tenantId_groupId_year_month_periodType_dataTypeId_k" RENAME TO "GroupTarget_tenantId_groupId_year_month_periodType_dataType_key";
