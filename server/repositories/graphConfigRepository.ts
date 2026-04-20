import { prisma } from '@/lib/prisma';

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
      defaultGraphType: string;
      defaultPeriodUnit: string;
    },
  ) {
    return prisma.graphConfig.upsert({
      where: { tenantId },
      create: { ...data, tenantId },
      update: data,
    });
  },
};
