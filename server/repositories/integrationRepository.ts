import { prisma } from '@/lib/prisma';
import { IntegrationStatus } from '@prisma/client';

export const integrationRepository = {
  findAll(tenantId: number) {
    return prisma.integration.findMany({
      where: { tenantId },
      orderBy: { id: 'asc' },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.integration.findFirst({
      where: { id, tenantId },
    });
  },

  updateStatus(id: number, tenantId: number, status: IntegrationStatus) {
    return prisma.integration.updateMany({
      where: { id, tenantId },
      data: { status },
    });
  },

  updateConfig(id: number, tenantId: number, config: Record<string, string>) {
    return prisma.integration.updateMany({
      where: { id, tenantId },
      data: { config },
    });
  },

  findByKey(serviceKey: string, tenantId: number) {
    return prisma.integration.findFirst({
      where: { serviceKey, tenantId },
    });
  },

  async upsertByKey(
    tenantId: number,
    serviceKey: string,
    data: { status?: IntegrationStatus; config?: Record<string, string> },
  ) {
    const existing = await prisma.integration.findFirst({
      where: { serviceKey, tenantId },
    });
    if (existing) {
      return prisma.integration.update({
        where: { id: existing.id },
        data,
      });
    }
    return prisma.integration.create({
      data: {
        serviceKey,
        status: data.status || 'DISCONNECTED',
        config: data.config || undefined,
        tenantId,
      },
    });
  },
};
