-- CustomSlide にディスプレイ設定への帰属 displayConfigId を追加（設定ごとに独立）。
-- 既存スライドは、それを参照している DisplayConfigView.customSlideId から
-- 逆引きして所属設定（displayConfigId）を埋める。

-- 1. nullable カラム追加
ALTER TABLE "CustomSlide" ADD COLUMN "displayConfigId" INTEGER;

-- 2. 既存データ移行: スライドを参照しているビューが属する設定に帰属させる。
--    複数設定が同一スライドを参照している場合は最小の displayConfigId に寄せる。
UPDATE "CustomSlide" cs
SET "displayConfigId" = sub.cfg_id
FROM (
  SELECT v."customSlideId" AS slide_id, MIN(v."displayConfigId") AS cfg_id
  FROM "DisplayConfigView" v
  WHERE v."customSlideId" IS NOT NULL
  GROUP BY v."customSlideId"
) sub
WHERE cs."id" = sub.slide_id;

-- 2-b. 整合性掃除: スライドは1設定にのみ帰属するため、別設定のビューが
--      そのスライドを参照している「実体なしスライドビュー」を削除する。
--      （移行前は全設定で共有されていた名残）。
DELETE FROM "DisplayConfigView" v
USING "CustomSlide" cs
WHERE v."customSlideId" = cs."id"
  AND v."viewType" = 'CUSTOM_SLIDE'
  AND cs."displayConfigId" IS DISTINCT FROM v."displayConfigId";

-- 3. FK 制約（設定削除でスライドも削除）と index
ALTER TABLE "CustomSlide"
  ADD CONSTRAINT "CustomSlide_displayConfigId_fkey"
  FOREIGN KEY ("displayConfigId") REFERENCES "DisplayConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CustomSlide_displayConfigId_idx" ON "CustomSlide"("displayConfigId");
