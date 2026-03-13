import { dataTypeRepository } from '../repositories/dataTypeRepository';
import type { Unit } from '@prisma/client';

export const dataTypeService = {
  async getAll(tenantId: number) {
    return dataTypeRepository.findAll(tenantId);
  },

  async getActive(tenantId: number) {
    return dataTypeRepository.findActive(tenantId);
  },

  async getById(tenantId: number, id: number) {
    return dataTypeRepository.findById(id, tenantId);
  },

  async getDefault(tenantId: number) {
    return dataTypeRepository.findDefault(tenantId);
  },

  async create(
    tenantId: number,
    data: { name: string; unit?: Unit; color?: string; sortOrder?: number },
  ) {
    return dataTypeRepository.create(tenantId, data);
  },

  async update(
    tenantId: number,
    id: number,
    data: {
      name?: string;
      unit?: Unit;
      color?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await dataTypeRepository.findById(id, tenantId);
    if (!existing) return null;

    await dataTypeRepository.update(id, tenantId, data);
    return dataTypeRepository.findById(id, tenantId);
  },

  async delete(tenantId: number, id: number) {
    const existing = await dataTypeRepository.findById(id, tenantId);
    if (!existing) return null;
    if (existing.isDefault) {
      throw new Error('デフォルトのデータ種類は削除できません');
    }

    const result = await dataTypeRepository.remove(id, tenantId);
    return result.count > 0 ? existing : null;
  },

  async updateSortOrders(
    tenantId: number,
    items: { id: number; sortOrder: number }[],
  ) {
    return dataTypeRepository.updateSortOrders(tenantId, items);
  },
};
