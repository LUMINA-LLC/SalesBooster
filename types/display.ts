import { ViewType, VIEW_TYPE_LABELS, NumberBoardMetric } from './index';

export const VALID_TRANSITIONS = ['NONE', 'FADE', 'SLIDE_LEFT', 'SLIDE_RIGHT'] as const;
export type TransitionType = (typeof VALID_TRANSITIONS)[number];

export type CustomSlideType = 'IMAGE' | 'YOUTUBE' | 'TEXT';

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
