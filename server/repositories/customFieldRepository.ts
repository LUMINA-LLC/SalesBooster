import { prisma } from '@/lib/prisma';
import { CustomFieldType, Prisma } from '@prisma/client';

export const customFieldRepository = {
  findAll(tenantId: number) {
    return prisma.customField.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findActive(tenantId: number) {
    return prisma.customField.findMany({
      where: { isActive: true, tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.customField.findFirst({ where: { id, tenantId } });
  },

  create(
    tenantId: number,
    data: {
      name: string;
      fieldType: CustomFieldType;
      options?: Prisma.InputJsonValue;
      isRequired?: boolean;
      sortOrder?: number;
    },
  ) {
    return prisma.customField.create({ data: { ...data, tenantId } });
  },

  update(
    id: number,
    tenantId: number,
    data: {
      name?: string;
      fieldType?: CustomFieldType;
      options?: Prisma.InputJsonValue;
      isRequired?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.customField.updateMany({ where: { id, tenantId }, data });
  },

  softDelete(id: number, tenantId: number) {
    return prisma.customField.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
  },
};
