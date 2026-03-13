import { prisma } from '@/lib/prisma';
import type { Unit } from '@prisma/client';

export const dataTypeRepository = {
  findAll(tenantId: number) {
    return prisma.dataType.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findActive(tenantId: number) {
    return prisma.dataType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.dataType.findFirst({
      where: { id, tenantId },
    });
  },

  findDefault(tenantId: number) {
    return prisma.dataType.findFirst({
      where: { tenantId, isDefault: true },
    });
  },

  create(
    tenantId: number,
    data: {
      name: string;
      unit?: Unit;
      color?: string;
      sortOrder?: number;
      isDefault?: boolean;
    },
  ) {
    return prisma.dataType.create({
      data: { ...data, tenantId },
    });
  },

  update(
    id: number,
    tenantId: number,
    data: {
      name?: string;
      unit?: Unit;
      color?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.dataType.updateMany({
      where: { id, tenantId },
      data,
    });
  },

  remove(id: number, tenantId: number) {
    return prisma.dataType.deleteMany({
      where: { id, tenantId, isDefault: false },
    });
  },

  updateSortOrders(
    tenantId: number,
    items: { id: number; sortOrder: number }[],
  ) {
    return prisma.$transaction(
      items.map((item) =>
        prisma.dataType.updateMany({
          where: { id: item.id, tenantId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  },

  createDefaultForTenant(tenantId: number) {
    return prisma.dataType.create({
      data: {
        name: '売上',
        unit: 'MAN_YEN',
        isDefault: true,
        isActive: true,
        sortOrder: 0,
        tenantId,
      },
    });
  },
};
