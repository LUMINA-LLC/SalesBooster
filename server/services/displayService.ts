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
import { NumberBoardMetric } from '@/types';
import { DisplayTransition, DisplayViewType } from '@prisma/client';

/**
 * DBにビューが1つも保存されていない初期状態のときのみ、デフォルトビューを返す。
 * 一度でもユーザーが保存したら（=ビューが1件以上あれば）、その構成をそのまま尊重する。
 * これによりユーザーが同種ビューを複数追加・削除した構成が補完で壊されない。
 */
function mergeDefaultViews(dbViews: DisplayViewConfig[]): DisplayViewConfig[] {
  if (dbViews.length === 0) {
    return DEFAULT_DISPLAY_CONFIG.views.filter(
      (dv) => dv.viewType !== 'CUSTOM_SLIDE',
    );
  }
  return dbViews;
}

/** DisplayConfig（フロント型）を repository の DisplayConfigInput へ変換する */
function toConfigInput(config: DisplayConfig) {
  return {
    ...(config.name !== undefined ? { name: config.name } : {}),
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
      dataTypeId: v.dataTypeId ?? null,
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
      membersPerPage: v.membersPerPage ?? null,
      aggregateField: v.aggregateField ?? '',
    })),
  };
}

/** DB レコード（CONFIG_INCLUDE 付き）を DisplayConfig 型へ変換する */
function mapRecordToConfig(
  record: NonNullable<Awaited<ReturnType<typeof displayConfigRepository.find>>>,
): DisplayConfig {
  const dbViews: DisplayViewConfig[] = record.views.map((v) => {
    const metrics = v.numberBoardMetrics
      ? (v.numberBoardMetrics.split(',').filter(Boolean) as NumberBoardMetric[])
      : undefined;

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
      dataTypeId: v.dataTypeId ?? null,
      numberBoardMetrics: metrics,
      numberBoardMetricConfigs: metricConfigs,
      periodMode: (v.periodMode as PeriodMode) ?? null,
      periodStartMonth: v.periodStartMonth ?? null,
      periodEndMonth: v.periodEndMonth ?? null,
      periodUnit: (v.periodUnit as PeriodUnit) ?? null,
      periodDateMode: (v.periodDateMode as PeriodDateMode) ?? null,
      fixedPeriodDate: v.fixedPeriodDate ?? null,
      membersPerPage: v.membersPerPage ?? null,
      aggregateField: v.aggregateField ?? '',
    };
  });

  return {
    id: record.id,
    name: record.name,
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
    views: mergeDefaultViews(dbViews),
  };
}

export const displayService = {
  async getConfig(tenantId: number): Promise<DisplayConfig> {
    const record = await displayConfigRepository.find(tenantId);
    if (!record) return DEFAULT_DISPLAY_CONFIG;
    return mapRecordToConfig(record);
  },

  /** configId 指定で取得。見つからなければ null（テナント越境も null）。 */
  async getConfigById(
    tenantId: number,
    configId: number,
  ): Promise<DisplayConfig | null> {
    const record = await displayConfigRepository.findById(tenantId, configId);
    return record ? mapRecordToConfig(record) : null;
  },

  /** テナント内の全設定一覧。 */
  async listConfigs(tenantId: number): Promise<DisplayConfig[]> {
    const records = await displayConfigRepository.findAll(tenantId);
    return records.map(mapRecordToConfig);
  },

  /** 新規設定を作成して返す。 */
  async createConfig(
    tenantId: number,
    config: DisplayConfig,
  ): Promise<DisplayConfig> {
    const record = await displayConfigRepository.create(
      tenantId,
      toConfigInput(config),
    );
    return mapRecordToConfig(record);
  },

  /** configId 指定で更新。見つからなければ false。 */
  async updateConfigById(
    tenantId: number,
    configId: number,
    config: DisplayConfig,
  ): Promise<boolean> {
    const record = await displayConfigRepository.update(
      tenantId,
      configId,
      toConfigInput(config),
    );
    return record !== null;
  },

  /** configId 指定で削除。 */
  async deleteConfig(tenantId: number, configId: number): Promise<boolean> {
    return displayConfigRepository.delete(tenantId, configId);
  },

  /** configId 指定で名前変更。 */
  async renameConfig(
    tenantId: number,
    configId: number,
    name: string,
  ): Promise<boolean> {
    return displayConfigRepository.rename(tenantId, configId, name);
  },

  /**
   * 速報表示用の解決済み設定を返す:
   * - 有効なデータ種別ID一覧
   * - データ種別ごとのメッセージ/動画ID（未設定時は全体デフォルト）
   */
  async getBreakingNewsResolvedConfig(
    tenantId: number,
    configId?: number,
  ): Promise<{
    defaultMessage: string;
    defaultVideoId: string;
    perDataType: Record<
      number,
      { enabled: boolean; message: string; videoId: string }
    >;
  }> {
    const record = await displayConfigRepository.findBreakingNewsConfig(
      tenantId,
      configId,
    );
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
    await displayConfigRepository.upsert(tenantId, toConfigInput(config));
  },
};
