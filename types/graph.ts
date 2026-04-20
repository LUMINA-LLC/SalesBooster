/** バースタイル */
export type BarStyle = 'CYLINDER' | 'FLAT' | 'ROUNDED';
export const BAR_STYLE_OPTIONS: { value: BarStyle; label: string }[] = [
  { value: 'CYLINDER', label: '3D円柱' },
  { value: 'FLAT', label: 'フラット' },
  { value: 'ROUNDED', label: '角丸' },
];

/** 視覚効果の強度 */
export type EffectIntensity = 'NONE' | 'LIGHT' | 'NORMAL' | 'STRONG';
export const EFFECT_INTENSITY_OPTIONS: {
  value: EffectIntensity;
  label: string;
}[] = [
  { value: 'NONE', label: 'なし' },
  { value: 'LIGHT', label: '弱' },
  { value: 'NORMAL', label: '標準' },
  { value: 'STRONG', label: '強' },
];

/** ダッシュボード初期表示のグラフ種類 */
export type DefaultGraphType =
  | 'PERIOD_GRAPH'
  | 'CUMULATIVE_GRAPH'
  | 'TREND_GRAPH';
export const DEFAULT_GRAPH_TYPE_OPTIONS: {
  value: DefaultGraphType;
  label: string;
}[] = [
  { value: 'PERIOD_GRAPH', label: '期間グラフ' },
  { value: 'CUMULATIVE_GRAPH', label: '累計グラフ' },
  { value: 'TREND_GRAPH', label: '推移グラフ' },
];

/** ダッシュボード初期期間単位 */
export type DefaultPeriodUnit = '月' | '週' | '日';
export const DEFAULT_PERIOD_UNIT_OPTIONS: {
  value: DefaultPeriodUnit;
  label: string;
}[] = [
  { value: '月', label: '月' },
  { value: '週', label: '週' },
  { value: '日', label: '日' },
];

/** グラフ設定 */
export interface GraphConfig {
  // 共通
  topColor: string;
  centerColor: string;
  lowColor: string;
  barStyle: BarStyle;
  showNormaLine: boolean;
  darkMode: boolean;
  gradientIntensity: EffectIntensity;
  glowIntensity: EffectIntensity;
  rankingLimit: number | null;
  // ダッシュボードのみ
  defaultGraphType: DefaultGraphType;
  defaultPeriodUnit: DefaultPeriodUnit;
}

export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  topColor: '#F59E0B',
  centerColor: '#0EA5E9',
  lowColor: '#14B8A6',
  barStyle: 'CYLINDER',
  showNormaLine: true,
  darkMode: false,
  gradientIntensity: 'NORMAL',
  glowIntensity: 'NORMAL',
  rankingLimit: null,
  defaultGraphType: 'PERIOD_GRAPH',
  defaultPeriodUnit: '月',
};
