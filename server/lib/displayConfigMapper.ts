import { DisplayPeriodMode } from '@prisma/client';
import {
  ViewInput,
  BreakingNewsInput,
  DisplayConfigInput,
} from './displayConfigTypes';

/** ViewInput を DisplayConfigView の create 入力に変換（create/update で共用） */
export function toViewCreate(v: ViewInput) {
  return {
    viewType: v.viewType,
    enabled: v.enabled,
    duration: v.duration,
    order: v.order,
    title: v.title,
    ...(v.customSlideId ? { customSlideId: v.customSlideId } : {}),
    dataTypeId: v.dataTypeId ?? '',
    numberBoardMetrics: v.numberBoardMetrics ?? '',
    numberBoardMetricConfigs: v.numberBoardMetricConfigs ?? '',
    periodMode: (v.periodMode as DisplayPeriodMode) ?? null,
    periodStartMonth: v.periodStartMonth ?? null,
    periodEndMonth: v.periodEndMonth ?? null,
    periodUnit: v.periodUnit ?? null,
    periodDateMode: v.periodDateMode ?? null,
    fixedPeriodDate: v.fixedPeriodDate ?? null,
    membersPerPage: v.membersPerPage ?? null,
  };
}

/** BreakingNewsInput を DisplayConfigBreakingNews の create 入力に変換 */
export function toBreakingNewsCreate(c: BreakingNewsInput) {
  return {
    dataTypeId: c.dataTypeId,
    enabled: c.enabled,
    breakingNewsMessage: c.message ?? null,
    breakingNewsVideoId: c.videoId ?? null,
  };
}

/** DisplayConfig 本体のスカラー＋ネスト create を組み立てる（create/update で共用） */
export function buildConfigData(data: DisplayConfigInput) {
  return {
    loop: data.loop,
    dataRefreshInterval: data.dataRefreshInterval,
    filterGroupId: data.filterGroupId,
    filterMemberId: data.filterMemberId,
    transition: data.transition,
    companyLogoUrl: data.companyLogoUrl,
    teamName: data.teamName,
    darkMode: data.darkMode,
    views: { create: data.views.map(toViewCreate) },
    breakingNewsConfigs: {
      create: (data.breakingNewsConfigs ?? []).map(toBreakingNewsCreate),
    },
  };
}

/** find / upsert の戻り値に使う共通 include */
export const CONFIG_INCLUDE = {
  views: { orderBy: { order: 'asc' as const }, include: { customSlide: true } },
  breakingNewsConfigs: true,
};
