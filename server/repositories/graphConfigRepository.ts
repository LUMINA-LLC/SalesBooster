import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const graphConfigRepository = {
  find(tenantId: number) {
    return prisma.graphConfig.findUnique({ where: { tenantId } });
  },

  upsert(
    tenantId: number,
    data: {
      topColor: string;
      centerColor: string;
      lowColor: string;
      barStyle: string;
      showNormaLine: boolean;
      darkMode: boolean;
      gradientIntensity: string;
      glowIntensity: string;
      rankingLimit: number | null;
      defaultViewSettings: Prisma.InputJsonValue;
    },
  ) {
    return prisma.graphConfig.upsert({
      where: { tenantId },
      create: { ...data, tenantId },
      update: data,
    });
  },
};
