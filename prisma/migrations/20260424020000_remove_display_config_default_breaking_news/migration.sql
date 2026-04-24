-- AlterTable: データ種別ごとの設定 (DisplayConfigBreakingNews) に移行したため
-- DisplayConfig から速報メッセージ・動画IDの全体デフォルトカラムを削除
ALTER TABLE "DisplayConfig" DROP COLUMN "breakingNewsMessage";
ALTER TABLE "DisplayConfig" DROP COLUMN "breakingNewsVideoId";
