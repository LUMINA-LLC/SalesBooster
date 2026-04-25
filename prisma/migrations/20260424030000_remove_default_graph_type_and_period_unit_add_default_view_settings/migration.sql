-- 初期表示タブの機能を廃止し、各グラフ別の初期値を保存する defaultViewSettings に統一
ALTER TABLE "GraphConfig" DROP COLUMN "defaultGraphType";
ALTER TABLE "GraphConfig" DROP COLUMN "defaultPeriodUnit";
ALTER TABLE "GraphConfig" ADD COLUMN "defaultViewSettings" JSONB;
