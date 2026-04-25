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

// ─── ダッシュボード各グラフの初期値（絶対値で固定保存） ───

/** 期間グラフ初期値 */
export interface PeriodGraphDefault {
  unit: '月' | '週' | '日';
  /** PeriodNavigatorのドロップダウン値そのまま (例: "2026年04月" / "2026年 04/22〜04/28" / "2026年04月22日") */
  dateLabel: string;
}

/** 累計グラフ / 推移グラフ初期値 */
export interface RangeGraphDefault {
  mode: '単月' | '期間';
  /** 単月時の月 (YYYY-MM) */
  month?: string;
  /** 期間時 */
  startMonth?: string;
  endMonth?: string;
}

/** レポート初期値 (基準月) */
export interface ReportDefault {
  /** 基準月 (YYYY-MM) */
  month: string;
}

/** レコード初期値 (期間のみ) */
export interface RecordDefault {
  startMonth: string;
  endMonth: string;
}

export interface DefaultViewSettings {
  PERIOD_GRAPH?: PeriodGraphDefault;
  CUMULATIVE_GRAPH?: RangeGraphDefault;
  TREND_GRAPH?: RangeGraphDefault;
  REPORT?: ReportDefault;
  RECORD?: RecordDefault;
}

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
  // ダッシュボード各グラフの初期値
  defaultViewSettings: DefaultViewSettings;
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
  defaultViewSettings: {},
};
