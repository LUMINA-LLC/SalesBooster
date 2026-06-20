/** 売上可視化ビュー（グラフ/ランキング/集計値ボード）関連の定数 */

import type { ViewType, NumberBoardMetric, PeriodUnit } from '@/types/salesView';

/** バリデーション等で使う全ビュー種別の列挙 */
export const VALID_VIEW_TYPES: readonly ViewType[] = [
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
  'REPORT',
  'RECORD',
  'CUSTOM_SLIDE',
  'NUMBER_BOARD',
];

export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
  PERIOD_GRAPH: '期間グラフ',
  CUMULATIVE_GRAPH: '累計グラフ',
  TREND_GRAPH: '推移グラフ',
  REPORT: 'レポート',
  RECORD: 'レコード',
  CUSTOM_SLIDE: 'カスタムスライド',
  NUMBER_BOARD: '集計値',
};

/**
 * 集計単位（メンバー/グループ）切り替えの対象ビュー種別。
 * ダッシュボードと同様、推移グラフ(TREND_GRAPH)以外で切り替え可能。
 */
export const AGGREGATION_UNIT_VIEW_TYPES: ReadonlySet<string> = new Set<string>([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'REPORT',
  'RECORD',
]);

/**
 * 集計単位（メンバー/グループ）切り替えUIを表示するのに必要な最小グループ数。
 * グループが1件以下ならグループ単位に意味がないため、トグル/セレクタを表示しない。
 */
export const MIN_GROUPS_FOR_AGGREGATION_UNIT = 2;

/** 期間単位（月/週/日）の選択肢。トグル表示順を兼ねる。 */
export const PERIOD_UNITS: readonly PeriodUnit[] = ['月', '週', '日'];

/** 期間単位の既定値（未設定時に使用）。 */
export const DEFAULT_PERIOD_UNIT: PeriodUnit = '月';

/**
 * 集計値のメイン値を表すキー。
 * 集計値プルダウンで ""/"value" はメイン値、"cf_<id>" は集計対象カスタムフィールドを表す。
 */
export const MAIN_AGGREGATE_VALUE = 'value';

export const NUMBER_BOARD_METRIC_LABELS: Record<NumberBoardMetric, string> = {
  TOTAL_SALES: '合計売上',
  TOTAL_COUNT: 'データ登録件数',
  AVG_ACHIEVEMENT: '平均達成率',
  TEAM_TARGET: 'チーム目標',
};
