import { prisma } from '@/lib/prisma';
import { CustomFieldType, Prisma, Unit } from '@prisma/client';

export const customFieldRepository = {
  findAll(tenantId: number, dataTypeId?: number) {
    return prisma.customField.findMany({
      where: { tenantId, ...(dataTypeId ? { dataTypeId } : {}) },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findActive(tenantId: number, dataTypeId?: number) {
    return prisma.customField.findMany({
      where: {
        isActive: true,
        tenantId,
        ...(dataTypeId ? { dataTypeId } : {}),
      },
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
      dataTypeId: number;
      options?: Prisma.InputJsonValue;
      isRequired?: boolean;
      aggregatable?: boolean;
      unit?: Unit;
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
      aggregatable?: boolean;
      unit?: Unit;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.customField.updateMany({ where: { id, tenantId }, data });
  },

  findAggregatable(tenantId: number, dataTypeId: number) {
    return prisma.customField.findMany({
      where: {
        tenantId,
        dataTypeId,
        isActive: true,
        fieldType: 'NUMBER',
        aggregatable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  softDelete(id: number, tenantId: number) {
    return prisma.customField.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
  },
};
