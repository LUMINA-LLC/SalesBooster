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
  TOTAL_COUNT: '契約件数',
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

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'ログイン',
  USER_LOGOUT: 'ログアウト',
  USER_CREATE: 'ユーザー追加',
  USER_UPDATE: 'ユーザー更新',
  USER_DELETE: 'ユーザー削除',
  GROUP_CREATE: 'グループ作成',
  GROUP_UPDATE: 'グループ更新',
  GROUP_DELETE: 'グループ削除',
  GROUP_SYNC_MEMBERS: 'グループメンバー同期',
  SALES_RECORD_CREATE: '売上データ入力',
  SALES_RECORD_UPDATE: '売上データ更新',
  SALES_RECORD_DELETE: '売上データ削除',
  TARGET_UPSERT: '目標設定',
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
