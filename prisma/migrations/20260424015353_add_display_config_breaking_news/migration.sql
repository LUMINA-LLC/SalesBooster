-- CreateTable
CREATE TABLE "DisplayConfigBreakingNews" (
    "id" SERIAL NOT NULL,
    "displayConfigId" INTEGER NOT NULL,
    "dataTypeId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "breakingNewsMessage" TEXT,
    "breakingNewsVideoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayConfigBreakingNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisplayConfigBreakingNews_displayConfigId_idx" ON "DisplayConfigBreakingNews"("displayConfigId");

-- CreateIndex
CREATE INDEX "DisplayConfigBreakingNews_dataTypeId_idx" ON "DisplayConfigBreakingNews"("dataTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayConfigBreakingNews_displayConfigId_dataTypeId_key" ON "DisplayConfigBreakingNews"("displayConfigId", "dataTypeId");

-- AddForeignKey
ALTER TABLE "DisplayConfigBreakingNews" ADD CONSTRAINT "DisplayConfigBreakingNews_displayConfigId_fkey" FOREIGN KEY ("displayConfigId") REFERENCES "DisplayConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayConfigBreakingNews" ADD CONSTRAINT "DisplayConfigBreakingNews_dataTypeId_fkey" FOREIGN KEY ("dataTypeId") REFERENCES "DataType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
