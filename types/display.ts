import { ViewType, NumberBoardMetric } from './salesView';

export const VALID_TRANSITIONS = [
  'NONE',
  'FADE',
  'SLIDE_LEFT',
  'SLIDE_RIGHT',
] as const;
export type TransitionType = (typeof VALID_TRANSITIONS)[number];

export type CustomSlideType = 'IMAGE' | 'YOUTUBE' | 'TEXT';

/** ビューごとの期間プリセット */
export const PERIOD_MODES = [
  'YTD',
  'LAST_3M',
  'LAST_6M',
  'FISCAL_YEAR',
  'CUSTOM',
] as const;
export type PeriodMode = (typeof PERIOD_MODES)[number];

export interface CustomSlideData {
  id: number;
  slideType: CustomSlideType;
  title: string;
  content: string;
  imageUrl: string;
}

/** NumberBoardメトリクスごとのデータ種類紐付け */
export interface NumberBoardMetricConfig {
  metric: NumberBoardMetric;
  dataTypeId?: string; // 空文字 or undefined = デフォルト
}

/** 期間グラフの期間単位 */
export type PeriodUnit = '月' | '週' | '日';
/** 期間グラフの期間決定モード */
export type PeriodDateMode = 'CURRENT' | 'FIXED';

export interface DisplayViewConfig {
  viewType: ViewType;
  enabled: boolean;
  duration: number; // 秒
  order: number;
  title: string;
  customSlideId?: number | null;
  customSlide?: CustomSlideData | null;
  dataTypeId?: number | null; // ビューごとのデータ種類（null = デフォルト）
  numberBoardMetrics?: NumberBoardMetric[];
  numberBoardMetricConfigs?: NumberBoardMetricConfig[]; // メトリクスごとのDT紐付け
  periodMode?: PeriodMode | null; // 累計/推移/レポートの期間プリセット
  periodStartMonth?: string | null; // YYYY-MM 形式（CUSTOM時のみ使用）
  periodEndMonth?: string | null; // YYYY-MM 形式（CUSTOM時のみ使用）
  // 期間グラフ（PERIOD_GRAPH）用
  periodUnit?: PeriodUnit | null; // 月/週/日
  periodDateMode?: PeriodDateMode | null; // CURRENT=常に最新 / FIXED=固定指定
  fixedPeriodDate?: string | null; // YYYY-MM-DD 形式（FIXEDモード時の基準日）
  // メンバーを横に並べるグラフ系ビュー（期間/累計）の表示人数。
  // null/0 = 全員表示（ページングなし）、N = 1ページ N 人ずつ自動ページ送り。
  membersPerPage?: number | null;
  // 集計値（ダッシュボードの集計値プルダウンと同形式）。
  // ""/"value" = メイン値、"cf_<id>" = 集計対象カスタムフィールド。
  // PERIOD_GRAPH / CUMULATIVE_GRAPH / TREND_GRAPH / RECORD で使用。
  aggregateField?: string | null;
}

/** データ更新間隔 Enum（Prisma Enumと一致させる） */
export type DataRefreshInterval =
  | 'SECONDS_10'
  | 'SECONDS_30'
  | 'MINUTES_1'
  | 'MINUTES_5'
  | 'MINUTES_15'
  | 'MINUTES_30';

/** データ種別ごとの速報設定（null/undefined = 決め打ちデフォルトを使用） */
export interface BreakingNewsConfig {
  dataTypeId: number;
  enabled: boolean;
  message?: string | null;
  videoId?: string | null;
}

/** breakingNewsConfigs 未設定時の決め打ちデフォルト値 */
export interface DisplayConfig {
  /** DB 上の設定ID（新規・デフォルトでは未設定） */
  id?: number;
  /** 設定名（1テナント複数設定の識別用） */
  name?: string;
  views: DisplayViewConfig[];
  loop: boolean;
  dataRefreshInterval: DataRefreshInterval;
  filter: { groupId: string; memberId: string };
  transition: TransitionType;
  companyLogoUrl: string;
  teamName: string;
  darkMode: boolean;
  breakingNewsConfigs: BreakingNewsConfig[]; // データ種別ごとの個別設定
}
