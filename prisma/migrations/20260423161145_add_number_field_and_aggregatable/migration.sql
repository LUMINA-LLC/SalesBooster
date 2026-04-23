-- AlterEnum
ALTER TYPE "CustomFieldType" ADD VALUE 'NUMBER';

-- AlterTable
ALTER TABLE "CustomField" ADD COLUMN     "aggregatable" BOOLEAN NOT NULL DEFAULT false;
