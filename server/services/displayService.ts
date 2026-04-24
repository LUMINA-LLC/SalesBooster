import { displayConfigRepository } from '../repositories/displayConfigRepository';
import {
  DisplayConfig,
  DisplayViewConfig,
  NumberBoardMetricConfig,
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_BREAKING_NEWS_MESSAGE,
  DEFAULT_BREAKING_NEWS_VIDEO_ID,
  TransitionType,
  PeriodMode,
  PeriodUnit,
  PeriodDateMode,
} from '@/types/display';
import { NumberBoardMetric, ViewType } from '@/types';
import { DisplayTransition, DisplayViewType } from '@prisma/client';

/**
 * DBから取得したビュー一覧に、DEFAULT_DISPLAY_CONFIGで定義されているが
 * DBに存在しないビュータイプがあれば末尾に追加する。
 * CUSTOM_SLIDEはユーザー作成なので対象外。
 */
function mergeDefaultViews(dbViews: DisplayViewConfig[]): DisplayViewConfig[] {
  const existingTypes = new Set<ViewType>(dbViews.map((v) => v.viewType));
  const missingDefaults = DEFAULT_DISPLAY_CONFIG.views.filter(
    (dv) => dv.viewType !== 'CUSTOM_SLIDE' && !existingTypes.has(dv.viewType),
  );

  if (missingDefaults.length === 0) return dbViews;

  return [
    ...dbViews,
    ...missingDefaults.map((dv, i) => ({
      ...dv,
      order: dbViews.length + i,
    })),
  ];
}

export const displayService = {
  async getConfig(tenantId: number): Promise<DisplayConfig> {
    const record = await displayConfigRepository.find(tenantId);
    if (!record) return DEFAULT_DISPLAY_CONFIG;

    const dbViews: DisplayViewConfig[] = record.views.map((v) => {
      const metrics = v.numberBoardMetrics
        ? (v.numberBoardMetrics
            .split(',')
            .filter(Boolean) as NumberBoardMetric[])
        : undefined;

      // numberBoardMetricConfigs: JSON文字列からパース
      let metricConfigs: NumberBoardMetricConfig[] | undefined;
      if (v.numberBoardMetricConfigs) {
        try {
          metricConfigs = JSON.parse(v.numberBoardMetricConfigs);
        } catch {
          metricConfigs = undefined;
        }
      }

      return {
        viewType: v.viewType,
        enabled: v.enabled,
        duration: v.duration,
        order: v.order,
        title: v.title,
        customSlideId: v.customSlideId ?? null,
        customSlide: v.customSlide
          ? {
              id: v.customSlide.id,
              slideType: v.customSlide.slideType,
              title: v.customSlide.title,
              content: v.customSlide.content,
              imageUrl: v.customSlide.imageUrl,
            }
          : undefined,
        dataTypeId: v.dataTypeId ?? '',
        numberBoardMetrics: metrics,
        numberBoardMetricConfigs: metricConfigs,
        periodMode: (v.periodMode as PeriodMode) ?? null,
        periodStartMonth: v.periodStartMonth ?? null,
        periodEndMonth: v.periodEndMonth ?? null,
        periodUnit: (v.periodUnit as PeriodUnit) ?? null,
        periodDateMode: (v.periodDateMode as PeriodDateMode) ?? null,
        fixedPeriodDate: v.fixedPeriodDate ?? null,
      };
    });

    const views = mergeDefaultViews(dbViews);

    return {
      loop: record.loop,
      dataRefreshInterval: record.dataRefreshInterval,
      filter: {
        groupId: record.filterGroupId,
        memberId: record.filterMemberId,
      },
      transition: record.transition as TransitionType,
      companyLogoUrl: record.companyLogoUrl,
      teamName: record.teamName,
      darkMode: record.darkMode,
      breakingNewsConfigs: record.breakingNewsConfigs.map((c) => ({
        dataTypeId: c.dataTypeId,
        enabled: c.enabled,
        message: c.breakingNewsMessage,
        videoId: c.breakingNewsVideoId,
      })),
      views,
    };
  },

  /**
   * 速報表示用の解決済み設定を返す:
   * - 有効なデータ種別ID一覧
   * - データ種別ごとのメッセージ/動画ID（未設定時は全体デフォルト）
   */
  async getBreakingNewsResolvedConfig(tenantId: number): Promise<{
    defaultMessage: string;
    defaultVideoId: string;
    perDataType: Record<
      number,
      { enabled: boolean; message: string; videoId: string }
    >;
  }> {
    const record =
      await displayConfigRepository.findBreakingNewsConfig(tenantId);
    const defaultMessage = DEFAULT_BREAKING_NEWS_MESSAGE;
    const defaultVideoId = DEFAULT_BREAKING_NEWS_VIDEO_ID;
    const perDataType: Record<
      number,
      { enabled: boolean; message: string; videoId: string }
    > = {};
    if (record?.breakingNewsConfigs) {
      for (const c of record.breakingNewsConfigs) {
        perDataType[c.dataTypeId] = {
          enabled: c.enabled,
          message: c.breakingNewsMessage ?? defaultMessage,
          videoId: c.breakingNewsVideoId ?? defaultVideoId,
        };
      }
    }
    return { defaultMessage, defaultVideoId, perDataType };
  },

  async updateConfig(tenantId: number, config: DisplayConfig): Promise<void> {
    await displayConfigRepository.upsert(tenantId, {
      loop: config.loop,
      dataRefreshInterval: config.dataRefreshInterval,
      filterGroupId: config.filter.groupId,
      filterMemberId: config.filter.memberId,
      transition: config.transition as DisplayTransition,
      companyLogoUrl: config.companyLogoUrl,
      teamName: config.teamName,
      darkMode: config.darkMode,
      breakingNewsConfigs: (config.breakingNewsConfigs ?? []).map((c) => ({
        dataTypeId: c.dataTypeId,
        enabled: c.enabled,
        message: c.message ?? null,
        videoId: c.videoId ?? null,
      })),
      views: config.views.map((v) => ({
        viewType: v.viewType as DisplayViewType,
        enabled: v.enabled,
        duration: v.duration,
        order: v.order,
        title: v.title ?? '',
        customSlideId: v.customSlideId ?? null,
        dataTypeId: v.dataTypeId ?? '',
        numberBoardMetrics: v.numberBoardMetrics
          ? v.numberBoardMetrics.join(',')
          : '',
        numberBoardMetricConfigs: v.numberBoardMetricConfigs
          ? JSON.stringify(v.numberBoardMetricConfigs)
          : '',
        periodMode: v.periodMode ?? null,
        periodStartMonth: v.periodStartMonth ?? null,
        periodEndMonth: v.periodEndMonth ?? null,
        periodUnit: v.periodUnit ?? null,
        periodDateMode: v.periodDateMode ?? null,
        fixedPeriodDate: v.fixedPeriodDate ?? null,
      })),
    });
  },
};
