/**
 * 売上可視化ビューの型群。
 * ダッシュボード・ディスプレイモード双方の各ビュー（期間/累計/推移グラフ・
 * レコード・集計値ボードなど）で共用する、媒体に依存しない表示用の型を集約する。
 */

/** 売上の集計対象1件（メンバー or グループ）。ランキング行・グラフのバーに対応。 */
export interface SalesEntry {
  rank: number;
  name: string;
  sales: number;
  target: number;
  achievement: number;
  imageUrl?: string;
  department?: string;
}

/** 集計単位: メンバー粒度 / グループ粒度 */
export type AggregationUnit = 'member' | 'group';

/**
 * ビュー種別。列挙値（VALID_VIEW_TYPES）やラベル（VIEW_TYPE_LABELS）は
 * const/salesView.ts に定義する。
 */
export type ViewType =
  | 'PERIOD_GRAPH'
  | 'CUMULATIVE_GRAPH'
  | 'TREND_GRAPH'
  | 'REPORT'
  | 'RECORD'
  | 'CUSTOM_SLIDE'
  | 'NUMBER_BOARD';

export type NumberBoardMetric =
  | 'TOTAL_SALES'
  | 'TOTAL_COUNT'
  | 'AVG_ACHIEVEMENT'
  | 'TEAM_TARGET';

export type PeriodUnit = '月' | '週' | '日';

/** ランキングボードの1項目（メンバー or グループ） */
export interface RankingEntry {
  rank: number;
  name: string;
  imageUrl?: string;
  amount: number;
}

export interface RankingColumn {
  label: string; // "TOTAL" or "2026/02" etc
  subLabel?: string; // "2025/02〜2026/02" etc
  isTotal: boolean;
  entries: RankingEntry[];
}

export interface RankingBoardData {
  columns: RankingColumn[];
}

export interface TrendData {
  month: string;
  sales: number;
  displayMonth: string;
}
