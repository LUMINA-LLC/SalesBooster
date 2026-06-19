/** レポートビュー（データ種類別の集計レポート・サマリー）の型群 */

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
