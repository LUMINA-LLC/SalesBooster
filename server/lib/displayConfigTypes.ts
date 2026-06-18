import {
  DisplayTransition,
  DisplayViewType,
  DisplayPeriodMode,
  DataRefreshInterval,
} from '@prisma/client';

/** displayConfigRepository.upsert に渡す 1 ビュー分の入力 */
export interface ViewInput {
  viewType: DisplayViewType;
  enabled: boolean;
  duration: number;
  order: number;
  title: string;
  customSlideId?: number | null;
  dataTypeId?: number | null;
  numberBoardMetrics?: string;
  numberBoardMetricConfigs?: string;
  periodMode?: DisplayPeriodMode | string | null;
  periodStartMonth?: string | null;
  periodEndMonth?: string | null;
  periodUnit?: string | null;
  periodDateMode?: string | null;
  fixedPeriodDate?: string | null;
  membersPerPage?: number | null;
  aggregateField?: string | null;
}

/** displayConfigRepository.upsert に渡す 1 速報設定分の入力 */
export interface BreakingNewsInput {
  dataTypeId: number;
  enabled: boolean;
  message?: string | null;
  videoId?: string | null;
}

/** displayConfigRepository.upsert に渡すディスプレイ設定全体の入力 */
export interface DisplayConfigInput {
  name?: string;
  loop: boolean;
  dataRefreshInterval: DataRefreshInterval;
  filterGroupId: string;
  filterMemberId: string;
  transition: DisplayTransition;
  companyLogoUrl: string;
  teamName: string;
  darkMode: boolean;
  views: ViewInput[];
  breakingNewsConfigs?: BreakingNewsInput[];
}
