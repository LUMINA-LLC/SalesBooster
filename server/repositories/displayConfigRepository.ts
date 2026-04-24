import { prisma } from '@/lib/prisma';
import {
  DisplayTransition,
  DisplayViewType,
  DisplayPeriodMode,
  DataRefreshInterval,
} from '@prisma/client';

export const displayConfigRepository = {
  async find(tenantId: number) {
    return prisma.displayConfig.findFirst({
      where: { tenantId },
      include: {
        views: { orderBy: { order: 'asc' }, include: { customSlide: true } },
        breakingNewsConfigs: true,
      },
    });
  },

  async upsert(
    tenantId: number,
    data: {
      loop: boolean;
      dataRefreshInterval: DataRefreshInterval;
      filterGroupId: string;
      filterMemberId: string;
      transition: DisplayTransition;
      companyLogoUrl: string;
      teamName: string;
      darkMode: boolean;
      views: {
        viewType: DisplayViewType;
        enabled: boolean;
        duration: number;
        order: number;
        title: string;
        customSlideId?: number | null;
        dataTypeId?: string;
        numberBoardMetrics?: string;
        numberBoardMetricConfigs?: string;
        periodMode?: DisplayPeriodMode | string | null;
        periodStartMonth?: string | null;
        periodEndMonth?: string | null;
        periodUnit?: string | null;
        periodDateMode?: string | null;
        fixedPeriodDate?: string | null;
      }[];
      breakingNewsConfigs?: {
        dataTypeId: number;
        enabled: boolean;
        message?: string | null;
        videoId?: string | null;
      }[];
    },
  ) {
    const existing = await prisma.displayConfig.findFirst({
      where: { tenantId },
    });

    if (existing) {
      return prisma.$transaction(async (tx) => {
        await tx.displayConfigView.deleteMany({
          where: { displayConfigId: existing.id },
        });
        await tx.displayConfigBreakingNews.deleteMany({
          where: { displayConfigId: existing.id },
        });
        return tx.displayConfig.update({
          where: { id: existing.id },
          data: {
            loop: data.loop,
            dataRefreshInterval: data.dataRefreshInterval,
            filterGroupId: data.filterGroupId,
            filterMemberId: data.filterMemberId,
            transition: data.transition,
            companyLogoUrl: data.companyLogoUrl,
            teamName: data.teamName,
            darkMode: data.darkMode,
            views: {
              create: data.views.map((v) => ({
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
              })),
            },
            breakingNewsConfigs: {
              create: (data.breakingNewsConfigs ?? []).map((c) => ({
                dataTypeId: c.dataTypeId,
                enabled: c.enabled,
                breakingNewsMessage: c.message ?? null,
                breakingNewsVideoId: c.videoId ?? null,
              })),
            },
          },
          include: {
            views: {
              orderBy: { order: 'asc' },
              include: { customSlide: true },
            },
            breakingNewsConfigs: true,
          },
        });
      });
    }

    return prisma.displayConfig.create({
      data: {
        tenantId,
        loop: data.loop,
        dataRefreshInterval: data.dataRefreshInterval,
        filterGroupId: data.filterGroupId,
        filterMemberId: data.filterMemberId,
        transition: data.transition,
        companyLogoUrl: data.companyLogoUrl,
        teamName: data.teamName,
        darkMode: data.darkMode,
        views: {
          create: data.views.map((v) => ({
            viewType: v.viewType,
            enabled: v.enabled,
            duration: v.duration,
            order: v.order,
            title: v.title,
            ...(v.customSlideId ? { customSlideId: v.customSlideId } : {}),
            numberBoardMetrics: v.numberBoardMetrics ?? '',
            periodMode: (v.periodMode as DisplayPeriodMode) ?? null,
            periodStartMonth: v.periodStartMonth ?? null,
            periodEndMonth: v.periodEndMonth ?? null,
            periodUnit: v.periodUnit ?? null,
            periodDateMode: v.periodDateMode ?? null,
            fixedPeriodDate: v.fixedPeriodDate ?? null,
          })),
        },
        breakingNewsConfigs: {
          create: (data.breakingNewsConfigs ?? []).map((c) => ({
            dataTypeId: c.dataTypeId,
            enabled: c.enabled,
            breakingNewsMessage: c.message ?? null,
            breakingNewsVideoId: c.videoId ?? null,
          })),
        },
      },
      include: {
        views: { orderBy: { order: 'asc' }, include: { customSlide: true } },
        breakingNewsConfigs: true,
      },
    });
  },

  /** データ種別ごとの速報設定を返す */
  async findBreakingNewsConfig(tenantId: number) {
    const config = await prisma.displayConfig.findFirst({
      where: { tenantId },
      select: {
        breakingNewsConfigs: {
          select: {
            dataTypeId: true,
            enabled: true,
            breakingNewsMessage: true,
            breakingNewsVideoId: true,
          },
        },
      },
    });
    return config;
  },
};
