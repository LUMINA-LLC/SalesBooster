-- CreateEnum
CREATE TYPE "DisplayPeriodMode" AS ENUM ('YTD', 'LAST_3M', 'LAST_6M', 'FISCAL_YEAR', 'CUSTOM');

-- AlterColumn: convert TEXT to enum
ALTER TABLE "DisplayConfigView" ALTER COLUMN "periodMode" TYPE "DisplayPeriodMode" USING "periodMode"::"DisplayPeriodMode";
