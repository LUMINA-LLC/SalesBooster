-- DropForeignKey
ALTER TABLE "AiChatSession" DROP CONSTRAINT "AiChatSession_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AiChatSession" DROP CONSTRAINT "AiChatSession_userId_fkey";

-- AddForeignKey
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
