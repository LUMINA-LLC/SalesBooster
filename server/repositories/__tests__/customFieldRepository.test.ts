import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { customFieldRepository } from '../customFieldRepository';

describe('customFieldRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全カスタムフィールドを取得する', async () => {
      const mockFields = [{ id: 1, name: 'Field1', tenantId, sortOrder: 0 }];
      prismaMock.customField.findMany.mockResolvedValue(mockFields);

      const result = await customFieldRepository.findAll(tenantId);

      expect(prismaMock.customField.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockFields);
    });
  });

  describe('findActive', () => {
    it('アクティブなカスタムフィールドのみ取得する', async () => {
      const mockFields = [{ id: 1, name: 'Field1', isActive: true }];
      prismaMock.customField.findMany.mockResolvedValue(mockFields);

      const result = await customFieldRepository.findActive(tenantId);

      expect(prismaMock.customField.findMany).toHaveBeenCalledWith({
        where: { isActive: true, tenantId },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockFields);
    });
  });

  describe('findById', () => {
    it('IDとテナントIDでカスタムフィールドを取得する', async () => {
      const mockField = { id: 1, name: 'Field1', tenantId };
      prismaMock.customField.findFirst.mockResolvedValue(mockField);

      const result = await customFieldRepository.findById(1, tenantId);

      expect(prismaMock.customField.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual(mockField);
    });
  });

  describe('create', () => {
    it('カスタムフィールドを作成する', async () => {
      const data = { name: 'New Field', fieldType: 'TEXT' as const };
      const mockCreated = { id: 1, ...data, tenantId };
      prismaMock.customField.create.mockResolvedValue(mockCreated);

      const result = await customFieldRepository.create(tenantId, data);

      expect(prismaMock.customField.create).toHaveBeenCalledWith({
        data: { ...data, tenantId },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('カスタムフィールドを更新する', async () => {
      const data = { name: 'Updated Field' };
      prismaMock.customField.updateMany.mockResolvedValue({ count: 1 });

      const result = await customFieldRepository.update(1, tenantId, data);

      expect(prismaMock.customField.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('softDelete', () => {
    it('カスタムフィールドを論理削除する', async () => {
      prismaMock.customField.updateMany.mockResolvedValue({ count: 1 });

      const result = await customFieldRepository.softDelete(1, tenantId);

      expect(prismaMock.customField.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data: { isActive: false },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
