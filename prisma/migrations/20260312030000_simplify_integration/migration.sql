-- Add serviceKey column based on existing icon values
ALTER TABLE "Integration" ADD COLUMN "serviceKey" TEXT;
UPDATE "Integration" SET "serviceKey" = "icon";
UPDATE "Integration" SET "serviceKey" = 'LINE' WHERE "serviceKey" IS NULL OR "serviceKey" = '';
ALTER TABLE "Integration" ALTER COLUMN "serviceKey" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Integration" DROP COLUMN "name";
ALTER TABLE "Integration" DROP COLUMN "description";
ALTER TABLE "Integration" DROP COLUMN "icon";

-- Add unique constraint
CREATE UNIQUE INDEX "Integration_tenantId_serviceKey_key" ON "Integration"("tenantId", "serviceKey");
