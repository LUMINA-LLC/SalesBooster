-- 1. まず nullable で追加
ALTER TABLE "CustomField" ADD COLUMN "dataTypeId" INTEGER;

-- 2. 既存レコードにデフォルト DataType を紐付け（同テナントの isDefault=true の DataType）
UPDATE "CustomField" cf
SET "dataTypeId" = (
  SELECT dt.id FROM "DataType" dt
  WHERE dt."tenantId" = cf."tenantId" AND dt."isDefault" = true
  LIMIT 1
)
WHERE cf."dataTypeId" IS NULL;

-- 3. デフォルト DataType がないテナントの場合、最初の DataType を使用
UPDATE "CustomField" cf
SET "dataTypeId" = (
  SELECT dt.id FROM "DataType" dt
  WHERE dt."tenantId" = cf."tenantId"
  ORDER BY dt."sortOrder" ASC, dt.id ASC
  LIMIT 1
)
WHERE cf."dataTypeId" IS NULL;

-- 4. NOT NULL 制約を追加
ALTER TABLE "CustomField" ALTER COLUMN "dataTypeId" SET NOT NULL;

-- 5. インデックスと外部キー
CREATE INDEX "CustomField_dataTypeId_idx" ON "CustomField"("dataTypeId");

ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_dataTypeId_fkey" FOREIGN KEY ("dataTypeId") REFERENCES "DataType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
