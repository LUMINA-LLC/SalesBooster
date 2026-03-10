-- AlterEnum
ALTER TYPE "DisplayViewType" ADD VALUE 'NUMBER_BOARD';

-- AlterTable
ALTER TABLE "DisplayConfigView" ADD COLUMN     "numberBoardMetrics" TEXT NOT NULL DEFAULT '';
