/** 売上可視化ビュー（グラフ/ランキング/集計値ボード）関連の定数 */

import type { ViewType, NumberBoardMetric } from '@/types/salesView';

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

export const NUMBER_BOARD_METRIC_LABELS: Record<NumberBoardMetric, string> = {
  TOTAL_SALES: '合計売上',
  TOTAL_COUNT: 'データ登録件数',
  AVG_ACHIEVEMENT: '平均達成率',
  TEAM_TARGET: 'チーム目標',
};
