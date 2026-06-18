-- DisplayConfigView.dataTypeId を String(@default "") から Int?(FK, onDelete: SetNull) へ移行する。
-- 既存値: "" = デフォルト → NULL、"<数値>" = データ種類ID → Int。
-- 非数値・削除済みデータ種類の孤立IDは NULL に落としてから FK 制約を張る。

-- 1. 一時的に nullable な Int カラムを追加
ALTER TABLE "DisplayConfigView" ADD COLUMN "dataTypeId_new" INTEGER;

-- 2. データ移行: 数値文字列のみ Int 化、それ以外（""含む）は NULL のまま
UPDATE "DisplayConfigView"
SET "dataTypeId_new" = CASE
  WHEN "dataTypeId" ~ '^[0-9]+$' THEN "dataTypeId"::INTEGER
  ELSE NULL
END;

-- 3. 孤立ID（存在しない DataType を参照している値）を NULL に掃除（FK 制約失敗を防ぐ）
UPDATE "DisplayConfigView"
SET "dataTypeId_new" = NULL
WHERE "dataTypeId_new" IS NOT NULL
  AND "dataTypeId_new" NOT IN (SELECT "id" FROM "DataType");

-- 4. 旧カラム削除・新カラムをリネーム
ALTER TABLE "DisplayConfigView" DROP COLUMN "dataTypeId";
ALTER TABLE "DisplayConfigView" RENAME COLUMN "dataTypeId_new" TO "dataTypeId";

-- 5. FK 制約と index を付与
ALTER TABLE "DisplayConfigView"
  ADD CONSTRAINT "DisplayConfigView_dataTypeId_fkey"
  FOREIGN KEY ("dataTypeId") REFERENCES "DataType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "DisplayConfigView_dataTypeId_idx" ON "DisplayConfigView"("dataTypeId");
