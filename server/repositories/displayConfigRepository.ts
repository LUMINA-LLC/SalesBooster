import { prisma } from '@/lib/prisma';
import { DisplayConfigInput } from '../lib/displayConfigTypes';
import { buildConfigData, CONFIG_INCLUDE } from '../lib/displayConfigMapper';

export const displayConfigRepository = {
  async find(tenantId: number) {
    return prisma.displayConfig.findFirst({
      where: { tenantId },
      include: CONFIG_INCLUDE,
    });
  },

  async upsert(tenantId: number, data: DisplayConfigInput) {
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
          data: buildConfigData(data),
          include: CONFIG_INCLUDE,
        });
      });
    }

    return prisma.displayConfig.create({
      data: { tenantId, ...buildConfigData(data) },
      include: CONFIG_INCLUDE,
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
