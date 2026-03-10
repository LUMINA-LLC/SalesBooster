-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
