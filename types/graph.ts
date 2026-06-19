/** バースタイル。選択肢は const/graph.ts の BAR_STYLE_OPTIONS。 */
export type BarStyle = 'CYLINDER' | 'FLAT' | 'ROUNDED';

/** 視覚効果の強度。選択肢は const/graph.ts の EFFECT_INTENSITY_OPTIONS。 */
export type EffectIntensity = 'NONE' | 'LIGHT' | 'NORMAL' | 'STRONG';

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
