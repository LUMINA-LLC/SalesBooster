-- DisplayConfig に設定名 name を追加（1テナント複数設定対応）。
-- 既存レコードは DEFAULT で 'デフォルト' になる。
ALTER TABLE "DisplayConfig" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'デフォルト';
