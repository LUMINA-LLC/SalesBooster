import { CustomFieldType } from '@prisma/client';
import { customFieldRepository } from '../repositories/customFieldRepository';

export const customFieldService = {
  async getAll(tenantId: number, dataTypeId?: number) {
    return customFieldRepository.findAll(tenantId, dataTypeId);
  },

  async getActive(tenantId: number, dataTypeId?: number) {
    return customFieldRepository.findActive(tenantId, dataTypeId);
  },

  async create(
    tenantId: number,
    data: {
      name: string;
      fieldType: CustomFieldType;
      dataTypeId: number;
      options?: string[];
      isRequired?: boolean;
    },
  ) {
    const all = await customFieldRepository.findAll(tenantId, data.dataTypeId);
    const maxOrder = all.reduce((max, f) => Math.max(max, f.sortOrder), -1);

    return customFieldRepository.create(tenantId, {
      name: data.name,
      fieldType: data.fieldType,
      dataTypeId: data.dataTypeId,
      options: data.options || undefined,
      isRequired: data.isRequired ?? false,
      sortOrder: maxOrder + 1,
    });
  },

  async update(
    tenantId: number,
    id: number,
    data: {
      name?: string;
      fieldType?: CustomFieldType;
      options?: string[];
      isRequired?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await customFieldRepository.findById(id, tenantId);
    if (!existing) return null;

    await customFieldRepository.update(id, tenantId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.fieldType !== undefined ? { fieldType: data.fieldType } : {}),
      ...(data.options !== undefined ? { options: data.options } : {}),
      ...(data.isRequired !== undefined ? { isRequired: data.isRequired } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });
    return customFieldRepository.findById(id, tenantId);
  },

  async softDelete(tenantId: number, id: number) {
    const existing = await customFieldRepository.findById(id, tenantId);
    if (!existing) return null;

    return customFieldRepository.softDelete(id, tenantId);
  },
};
