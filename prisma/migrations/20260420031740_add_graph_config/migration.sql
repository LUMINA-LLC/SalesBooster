-- CreateTable
CREATE TABLE "GraphConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "topColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "centerColor" TEXT NOT NULL DEFAULT '#0EA5E9',
    "lowColor" TEXT NOT NULL DEFAULT '#14B8A6',
    "barStyle" TEXT NOT NULL DEFAULT 'CYLINDER',
    "showNormaLine" BOOLEAN NOT NULL DEFAULT true,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "gradientIntensity" TEXT NOT NULL DEFAULT 'NORMAL',
    "glowIntensity" TEXT NOT NULL DEFAULT 'NORMAL',
    "rankingLimit" INTEGER,
    "defaultGraphType" TEXT NOT NULL DEFAULT 'PERIOD_GRAPH',
    "defaultPeriodUnit" TEXT NOT NULL DEFAULT '月',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GraphConfig_tenantId_key" ON "GraphConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "GraphConfig" ADD CONSTRAINT "GraphConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
