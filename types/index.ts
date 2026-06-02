import type { AuditAction } from '@prisma/client';
import type { UnitValue } from './units';

export interface SalesPerson {
  rank: number;
  name: string;
  sales: number;
  target: number;
  achievement: number;
  imageUrl?: string;
  department?: string;
}

export const VALID_VIEW_TYPES = [
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
  'REPORT',
  'RECORD',
  'CUSTOM_SLIDE',
  'NUMBER_BOARD',
] as const;
export type ViewType = (typeof VALID_VIEW_TYPES)[number];

export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
  PERIOD_GRAPH: '期間グラフ',
  CUMULATIVE_GRAPH: '累計グラフ',
  TREND_GRAPH: '推移グラフ',
  REPORT: 'レポート',
  RECORD: 'レコード',
  CUSTOM_SLIDE: 'カスタムスライド',
  NUMBER_BOARD: '数字ドン',
};

export type NumberBoardMetric =
  | 'TOTAL_SALES'
  | 'TOTAL_COUNT'
  | 'AVG_ACHIEVEMENT'
  | 'TEAM_TARGET';

export const NUMBER_BOARD_METRIC_LABELS: Record<NumberBoardMetric, string> = {
  TOTAL_SALES: '合計売上',
  TOTAL_COUNT: 'データ登録件数',
  AVG_ACHIEVEMENT: '平均達成率',
  TEAM_TARGET: 'チーム目標',
};

export type PeriodUnit = '月' | '週' | '日';

export interface RankingMember {
  rank: number;
  name: string;
  imageUrl?: string;
  amount: number;
}

export interface RankingColumn {
  label: string; // "TOTAL" or "2026/02" etc
  subLabel?: string; // "2025/02〜2026/02" etc
  isTotal: boolean;
  members: RankingMember[];
}

export interface RankingBoardData {
  columns: RankingColumn[];
}

export interface TrendData {
  month: string;
  sales: number;
  displayMonth: string;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_LOGIN: 'ログイン',
  USER_LOGIN_FAILED: 'ログイン失敗',
  USER_LOGOUT: 'ログアウト',
  USER_CREATE: 'ユーザー追加',
  USER_UPDATE: 'ユーザー更新',
  USER_DELETE: 'ユーザー削除',
  USER_PASSWORD_CHANGE: 'パスワード変更',
  USER_TERMS_ACCEPT: '利用規約同意',
  GROUP_CREATE: 'グループ作成',
  GROUP_UPDATE: 'グループ更新',
  GROUP_DELETE: 'グループ削除',
  GROUP_SYNC_MEMBERS: 'グループメンバー同期',
  GROUP_ADD_MEMBER: 'グループメンバー追加',
  GROUP_END_MEMBERSHIP: 'グループメンバー終了',
  GROUP_REMOVE_MEMBERSHIP: 'グループメンバー削除',
  SALES_RECORD_CREATE: '売上データ入力',
  SALES_RECORD_UPDATE: '売上データ更新',
  SALES_RECORD_DELETE: '売上データ削除',
  TARGET_UPSERT: '目標設定',
  TARGET_BULK_UPSERT: '目標一括設定',
  GROUP_TARGET_UPSERT: 'グループ目標設定',
  SETTINGS_UPDATE: 'システム設定変更',
  INTEGRATION_STATUS_UPDATE: '連携ステータス変更',
  DISPLAY_CONFIG_UPDATE: 'ディスプレイ設定変更',
  CUSTOM_FIELD_CREATE: 'カスタムフィールド追加',
  CUSTOM_FIELD_UPDATE: 'カスタムフィールド更新',
  CUSTOM_FIELD_DELETE: 'カスタムフィールド削除',
  CUSTOM_SLIDE_CREATE: 'カスタムスライド追加',
  CUSTOM_SLIDE_UPDATE: 'カスタムスライド更新',
  CUSTOM_SLIDE_DELETE: 'カスタムスライド削除',
  TENANT_CREATE: 'テナント作成',
  TENANT_UPDATE: 'テナント更新',
  TENANT_DELETE: 'テナント削除',
  DATA_TYPE_CREATE: 'データ種類追加',
  DATA_TYPE_UPDATE: 'データ種類更新',
  DATA_TYPE_DELETE: 'データ種類削除',
  SUBSCRIPTION_CREATE: 'サブスクリプション作成',
  SUBSCRIPTION_UPDATE: 'サブスクリプション更新',
  SUBSCRIPTION_EXPIRE: 'サブスクリプション失効',
};

export interface DataTypeInfo {
  id: number;
  name: string;
  unit: UnitValue;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface ReportData {
  monthlyTrend: {
    month: string;
    displayMonth: string;
    sales: number;
    movingAvg: number | null;
  }[];
  cumulativeTrend: {
    month: string;
    displayMonth: string;
    cumulative: number;
  }[];
  dayOfWeekRatio: { day: string; amount: number; ratio: number }[];
  periodRatio: { period: string; amount: number; ratio: number }[];
  stats: {
    monthlyAvg: number;
    dailyAvg: number;
    targetDays: number;
    targetMonths: number;
    landingPrediction: number;
    landingMonth: string;
  };
}

// ===== レポートサマリー（データ種類別の集計レポート） =====

/** レポートの期間種別 */
export type ReportPeriodKey =
  | 'current' // 今月
  | 'prevMonth' // 先月
  | 'avg3m' // 過去3ヶ月平均
  | 'avg6m' // 過去6ヶ月平均
  | 'avg1y'; // 過去1年平均

/** 1指標（メイン値 or カスタムフィールド）の1期間分の集計値 */
export interface ReportMetric {
  value: number; // 単位変換後の値
  target: number | null; // 目標値（メイン値のみ。CFは null）
  achievement: number | null; // 達成率%（target が正のときのみ）
  unit: string;
}

/** データ種類1つ分の指標（メイン値＋集計対象カスタムフィールド群） */
export interface ReportDataTypeMetrics {
  dataTypeId: number;
  dataTypeName: string;
  /** メイン値（目標・達成率あり） */
  main: ReportMetric;
  /** 集計対象カスタムフィールド（値のみ。target/achievement は null） */
  customFields: { id: number; name: string; metric: ReportMetric }[];
}

/** 期間1つ分の全データ種類の集計 */
export interface ReportPeriodSummary {
  periodKey: ReportPeriodKey;
  label: string; // "2026/06" や "過去3ヶ月平均" など
  dataTypes: ReportDataTypeMetrics[];
}

/** データ種類ごとの年間棒グラフ（今年度実績 vs 昨年度実績の月別比較） */
export interface ReportAnnualChart {
  dataTypeId: number;
  dataTypeName: string;
  unit: string;
  months: {
    month: string; // "YYYY-MM"
    displayMonth: string; // "M月"
    thisYear: number; // 当年実績（メイン値）
    lastYear: number; // 前年同月実績（メイン値）
  }[];
}

/** レポートサマリー全体 */
export interface ReportSummary {
  periods: ReportPeriodSummary[]; // 上段パネル用（今月＋各平均）
  annualCharts: ReportAnnualChart[]; // 下段棒グラフ用
}
