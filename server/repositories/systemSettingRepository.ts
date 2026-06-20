import { prisma } from '@/server/lib/prisma';

export const systemSettingRepository = {
  findAll(tenantId: number) {
    return prisma.systemSetting.findMany({
      where: { tenantId },
      orderBy: { key: 'asc' },
    });
  },

  findByKey(key: string, tenantId: number) {
    return prisma.systemSetting.findFirst({
      where: { key, tenantId },
    });
  },

  upsert(tenantId: number, key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value },
      create: { key, value, tenantId },
    });
  },
};
