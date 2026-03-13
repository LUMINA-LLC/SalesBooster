import { describe, it, expect, beforeEach } from 'vitest';
import { Unit } from '@prisma/client';
import { prismaMock } from '../../__mocks__/prisma';
import { dataTypeRepository } from '../dataTypeRepository';

describe('dataTypeRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全データタイプを取得する', async () => {
      const mockTypes = [{ id: 1, name: '売上', tenantId }];
      prismaMock.dataType.findMany.mockResolvedValue(mockTypes);

      const result = await dataTypeRepository.findAll(tenantId);

      expect(prismaMock.dataType.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockTypes);
    });
  });

  describe('findActive', () => {
    it('アクティブなデータタイプのみ取得する', async () => {
      const mockTypes = [{ id: 1, name: '売上', isActive: true }];
      prismaMock.dataType.findMany.mockResolvedValue(mockTypes);

      const result = await dataTypeRepository.findActive(tenantId);

      expect(prismaMock.dataType.findMany).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockTypes);
    });
  });

  describe('findById', () => {
    it('IDとテナントIDでデータタイプを取得する', async () => {
      const mockType = { id: 1, name: '売上', tenantId };
      prismaMock.dataType.findFirst.mockResolvedValue(mockType);

      const result = await dataTypeRepository.findById(1, tenantId);

      expect(prismaMock.dataType.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual(mockType);
    });
  });

  describe('findDefault', () => {
    it('デフォルトのデータタイプを取得する', async () => {
      const mockType = { id: 1, name: '売上', isDefault: true };
      prismaMock.dataType.findFirst.mockResolvedValue(mockType);

      const result = await dataTypeRepository.findDefault(tenantId);

      expect(prismaMock.dataType.findFirst).toHaveBeenCalledWith({
        where: { tenantId, isDefault: true },
      });
      expect(result).toEqual(mockType);
    });
  });

  describe('create', () => {
    it('データタイプを作成する', async () => {
      const data = { name: '件数', unit: Unit.KEN };
      const mockCreated = { id: 2, ...data, tenantId };
      prismaMock.dataType.create.mockResolvedValue(mockCreated);

      const result = await dataTypeRepository.create(tenantId, data);

      expect(prismaMock.dataType.create).toHaveBeenCalledWith({
        data: { ...data, tenantId },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('データタイプを更新する', async () => {
      const data = { name: '更新後' };
      prismaMock.dataType.updateMany.mockResolvedValue({ count: 1 });

      const result = await dataTypeRepository.update(1, tenantId, data);

      expect(prismaMock.dataType.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('remove', () => {
    it('デフォルト以外のデータタイプを削除する', async () => {
      prismaMock.dataType.deleteMany.mockResolvedValue({ count: 1 });

      const result = await dataTypeRepository.remove(2, tenantId);

      expect(prismaMock.dataType.deleteMany).toHaveBeenCalledWith({
        where: { id: 2, tenantId, isDefault: false },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('updateSortOrders', () => {
    it('配列渡しの$transactionでソート順を一括更新する', async () => {
      const items = [
        { id: 1, sortOrder: 0 },
        { id: 2, sortOrder: 1 },
      ];
      prismaMock.$transaction.mockResolvedValue(undefined);

      await dataTypeRepository.updateSortOrders(tenantId, items);

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()])
      );
    });
  });

  describe('createDefaultForTenant', () => {
    it('テナント用のデフォルトデータタイプを作成する', async () => {
      const mockCreated = { id: 1, name: '売上', unit: 'MAN_YEN', isDefault: true, isActive: true, sortOrder: 0, tenantId };
      prismaMock.dataType.create.mockResolvedValue(mockCreated);

      const result = await dataTypeRepository.createDefaultForTenant(tenantId);

      expect(prismaMock.dataType.create).toHaveBeenCalledWith({
        data: {
          name: '売上',
          unit: 'MAN_YEN',
          isDefault: true,
          isActive: true,
          sortOrder: 0,
          tenantId,
        },
      });
      expect(result).toEqual(mockCreated);
    });
  });
});
