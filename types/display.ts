import { ViewType, VIEW_TYPE_LABELS, NumberBoardMetric } from './index';

export const VALID_TRANSITIONS = ['NONE', 'FADE', 'SLIDE_LEFT', 'SLIDE_RIGHT'] as const;
export type TransitionType = (typeof VALID_TRANSITIONS)[number];

export type CustomSlideType = 'IMAGE' | 'YOUTUBE' | 'TEXT';

/** ビューごとの期間プリセット */
export const PERIOD_MODES = ['YTD', 'LAST_3M', 'LAST_6M', 'FISCAL_YEAR', 'CUSTOM'] as const;
export type PeriodMode = (typeof PERIOD_MODES)[number];
export const PERIOD_MODE_LABELS: Record<PeriodMode, string> = {
  YTD: '年初〜当月',
  LAST_3M: '直近3ヶ月',
  LAST_6M: '直近6ヶ月',
  FISCAL_YEAR: '今年度（4月〜）',
  CUSTOM: 'カスタム',
};

export interface CustomSlideData {
  id: number;
  slideType: CustomSlideType;
  title: string;
  content: string;
  imageUrl: string;
}

export interface DisplayViewConfig {
  viewType: ViewType;
  enabled: boolean;
  duration: number;  // 秒
  order: number;
  title: string;
  customSlideId?: number | null;
  customSlide?: CustomSlideData | null;
  numberBoardMetrics?: NumberBoardMetric[];
  periodMode?: PeriodMode | null;       // 期間プリセット（null = デフォルト YTD）
  periodStartMonth?: string | null;     // YYYY-MM 形式（CUSTOM時のみ使用）
  periodEndMonth?: string | null;       // YYYY-MM 形式（CUSTOM時のみ使用）
}

export function getViewTitle(view: DisplayViewConfig): string {
  return view.title || VIEW_TYPE_LABELS[view.viewType];
}

export interface DisplayConfig {
  views: DisplayViewConfig[];
  loop: boolean;
  dataRefreshInterval: number;  // ミリ秒
  filter: { groupId: string; memberId: string };
  transition: TransitionType;
  companyLogoUrl: string;
  teamName: string;
  darkMode: boolean;
}

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  views: [
    { viewType: 'PERIOD_GRAPH', enabled: true, duration: 30, order: 0, title: '' },
    { viewType: 'CUMULATIVE_GRAPH', enabled: true, duration: 30, order: 1, title: '' },
    { viewType: 'TREND_GRAPH', enabled: true, duration: 30, order: 2, title: '' },
    { viewType: 'REPORT', enabled: true, duration: 30, order: 3, title: '' },
    { viewType: 'RECORD', enabled: true, duration: 30, order: 4, title: '' },
    { viewType: 'NUMBER_BOARD', enabled: true, duration: 15, order: 5, title: '', numberBoardMetrics: ['TOTAL_SALES', 'TOTAL_COUNT'] },
  ],
  loop: true,
  dataRefreshInterval: 60000,
  filter: { groupId: '', memberId: '' },
  transition: 'NONE',
  companyLogoUrl: '',
  teamName: '',
  darkMode: false,
};
