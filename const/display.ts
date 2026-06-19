/** ディスプレイモード関連の定数 */

import type {
  PeriodMode,
  DataRefreshInterval,
  DisplayConfig,
} from '@/types/display';
import type { ViewType } from '@/types/salesView';

/**
 * ビュー切替トランジションの所要時間（ms）。
 * CSS（globals.css の .vt-* クラス）の transition 値と揃えること。
 */
export const TRANSITION_MS = 500;

/** 速報オーバーレイ: 動画開始後この時間（ms）でオーバーレイ表示 */
export const OVERLAY_DELAY_MS = 2000;

export const PERIOD_MODE_LABELS: Record<PeriodMode, string> = {
  YTD: '年初〜当月',
  LAST_3M: '直近3ヶ月',
  LAST_6M: '直近6ヶ月',
  FISCAL_YEAR: '今年度（4月〜）',
  CUSTOM: 'カスタム',
};

/** 「ビューを追加」で選べるビュータイプ（カスタムスライドは専用フローのため別扱い） */
export const ADDABLE_VIEW_TYPES: ViewType[] = [
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
  'REPORT',
  'RECORD',
  'NUMBER_BOARD',
];

/** Enum → ミリ秒の変換マップ */
export const DATA_REFRESH_INTERVAL_MS: Record<DataRefreshInterval, number> = {
  SECONDS_10: 10_000,
  SECONDS_30: 30_000,
  MINUTES_1: 60_000,
  MINUTES_5: 300_000,
  MINUTES_15: 900_000,
  MINUTES_30: 1_800_000,
};

/** データ更新間隔の選択肢 */
export const DATA_REFRESH_INTERVAL_OPTIONS: {
  value: DataRefreshInterval;
  label: string;
}[] = [
  { value: 'SECONDS_10', label: '10秒' },
  { value: 'SECONDS_30', label: '30秒' },
  { value: 'MINUTES_1', label: '1分' },
  { value: 'MINUTES_5', label: '5分' },
  { value: 'MINUTES_15', label: '15分' },
  { value: 'MINUTES_30', label: '30分' },
];

/** breakingNewsConfigs 未設定時の決め打ちデフォルト値 */
export const DEFAULT_BREAKING_NEWS_MESSAGE = 'おめでとう！';
export const DEFAULT_BREAKING_NEWS_VIDEO_ID = '1';

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  name: 'デフォルト',
  views: [
    {
      viewType: 'PERIOD_GRAPH',
      enabled: true,
      duration: 30,
      order: 0,
      title: '',
    },
    {
      viewType: 'CUMULATIVE_GRAPH',
      enabled: true,
      duration: 30,
      order: 1,
      title: '',
    },
    {
      viewType: 'TREND_GRAPH',
      enabled: true,
      duration: 30,
      order: 2,
      title: '',
    },
    { viewType: 'REPORT', enabled: true, duration: 30, order: 3, title: '' },
    { viewType: 'RECORD', enabled: true, duration: 30, order: 4, title: '' },
    {
      viewType: 'NUMBER_BOARD',
      enabled: true,
      duration: 15,
      order: 5,
      title: '',
      numberBoardMetrics: ['TOTAL_SALES', 'TOTAL_COUNT'],
    },
  ],
  loop: true,
  dataRefreshInterval: 'SECONDS_10',
  filter: { groupId: '', memberId: '' },
  transition: 'NONE',
  companyLogoUrl: '',
  teamName: '',
  darkMode: false,
  breakingNewsConfigs: [],
};
