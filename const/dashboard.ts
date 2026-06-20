/**
 * ダッシュボード画面（トップ画面の FilterBar）専用の定数。
 * 複数画面で共有する売上ビュー定数は const/salesView.ts に置く。
 * ここはダッシュボードのみで使うビュー種別ごとの表示制御をまとめる。
 */

import type { ViewType } from '@/types/salesView';

/** オーバーレイライン（グラフに重ねる補助線）の種別。 */
export type OverlayLineType = 'norma' | 'prev_month' | 'prev_year';

/** オーバーレイラインの選択肢（表示順を兼ねる）。 */
export const OVERLAY_LINE_OPTIONS: { value: OverlayLineType; label: string }[] =
  [
    { value: 'norma', label: 'ノルマ' },
    { value: 'prev_month', label: '前月平均' },
    { value: 'prev_year', label: '前年同月平均' },
  ];

/** オーバーレイラインの既定の選択状態（初期表示はノルマのみ）。 */
export const DEFAULT_OVERLAY_LINES: OverlayLineType[] = ['norma'];

/** 期間ナビゲータの期間タイプ選択肢（単月 / 期間）。 */
export const PERIOD_TYPE_OPTIONS = ['単月', '期間'] as const;
export type PeriodType = (typeof PERIOD_TYPE_OPTIONS)[number];

/**
 * 期間選択（PeriodNavigator の期間範囲指定）を表示するビュー種別。
 * 期間グラフは単月UIを使うため対象外。
 */
export const PERIOD_SELECTION_VIEW_TYPES: ReadonlySet<ViewType> =
  new Set<ViewType>(['CUMULATIVE_GRAPH', 'TREND_GRAPH', 'RECORD']);

/**
 * 期間選択を「期間範囲のみ」（単月UIを出さない）に強制するビュー種別。
 * レコードは常に期間範囲で表示する。
 */
export const FORCE_PERIOD_ONLY_VIEW_TYPES: ReadonlySet<ViewType> =
  new Set<ViewType>(['RECORD']);

/**
 * 期間単位トグル（月/週/日）を表示するビュー種別。
 * 月/週/日の切替は期間グラフのみで意味を持つ。
 */
export const PERIOD_UNIT_TOGGLE_VIEW_TYPES: ReadonlySet<ViewType> =
  new Set<ViewType>(['PERIOD_GRAPH']);

/**
 * オーバーレイライン（ノルマ/前月平均/前年同月平均）の表示UIを出すビュー種別。
 */
export const OVERLAY_LINE_VIEW_TYPES: ReadonlySet<ViewType> = new Set<ViewType>([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
]);
