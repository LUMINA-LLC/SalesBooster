/** ディスプレイ設定に関するヘルパー関数 */

import type { DisplayViewConfig } from '@/types/display';
import type { ViewType } from '@/types/salesView';
import { VIEW_TYPE_LABELS } from '@/const/salesView';

/** ビューの表示タイトルを取得（未設定時はビュー種別の既定ラベル） */
export function getViewTitle(view: DisplayViewConfig): string {
  return view.title || VIEW_TYPE_LABELS[view.viewType];
}

/**
 * 指定 viewType の新規ビュー設定をデフォルト値で生成する。
 * order は呼び出し側で配列末尾に合わせて上書きする。
 */
export function createDefaultView(
  viewType: ViewType,
  order: number,
): DisplayViewConfig {
  const base: DisplayViewConfig = {
    viewType,
    enabled: true,
    duration: viewType === 'NUMBER_BOARD' ? 15 : 30,
    order,
    title: '',
  };
  if (viewType === 'NUMBER_BOARD') {
    base.numberBoardMetrics = ['TOTAL_SALES', 'TOTAL_COUNT'];
  }
  return base;
}
