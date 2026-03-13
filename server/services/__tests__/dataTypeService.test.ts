import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataTypeService } from '../dataTypeService';
import { dataTypeRepository } from '../../repositories/dataTypeRepository';

vi.mock('../../repositories/dataTypeRepository');

const mockedRepo = vi.mocked(dataTypeRepository);

describe('dataTypeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('テナントの全データ種類を返す', async () => {
      const mockTypes = [{ id: 1, name: '売上' }];
      mockedRepo.findAll.mockResolvedValue(mockTypes as never);

      const result = await dataTypeService.getAll(1);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTypes);
    });
  });

  describe('getActive', () => {
    it('アクティブなデータ種類のみ返す', async () => {
      const mockTypes = [{ id: 1, name: '売上', isActive: true }];
      mockedRepo.findActive.mockResolvedValue(mockTypes as never);

      const result = await dataTypeService.getActive(1);

      expect(mockedRepo.findActive).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTypes);
    });
  });

  describe('getById', () => {
    it('IDでデータ種類を取得する', async () => {
      const mockType = { id: 1, name: '売上' };
      mockedRepo.findById.mockResolvedValue(mockType as never);

      const result = await dataTypeService.getById(1, 1);

      expect(mockedRepo.findById).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockType);
    });
  });

  describe('getDefault', () => {
    it('デフォルトのデータ種類を返す', async () => {
      const mockType = { id: 1, name: 'デフォルト', isDefault: true };
      mockedRepo.findDefault.mockResolvedValue(mockType as never);

      const result = await dataTypeService.getDefault(1);

      expect(mockedRepo.findDefault).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockType);
    });
  });

  describe('create', () => {
    it('新しいデータ種類を作成する', async () => {
      const created = { id: 1, name: '件数' };
      mockedRepo.create.mockResolvedValue(created as never);

      const result = await dataTypeService.create(1, { name: '件数', unit: 'KEN' as never });

      expect(mockedRepo.create).toHaveBeenCalledWith(1, { name: '件数', unit: 'KEN' });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('存在するデータ種類を更新して返す', async () => {
      const existing = { id: 1, name: '旧名' };
      const updated = { id: 1, name: '新名' };
      mockedRepo.findById.mockResolvedValueOnce(existing as never);
      mockedRepo.update.mockResolvedValue(undefined as never);
      mockedRepo.findById.mockResolvedValueOnce(updated as never);

      const result = await dataTypeService.update(1, 1, { name: '新名' });

      expect(mockedRepo.update).toHaveBeenCalledWith(1, 1, { name: '新名' });
      expect(result).toEqual(updated);
    });

    it('存在しないデータ種類の場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await dataTypeService.update(1, 999, { name: '新名' });

      expect(result).toBeNull();
      expect(mockedRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('存在する非デフォルトデータ種類を削除する', async () => {
      const existing = { id: 1, name: '売上', isDefault: false };
      mockedRepo.findById.mockResolvedValue(existing as never);
      mockedRepo.remove.mockResolvedValue({ count: 1 } as never);

      const result = await dataTypeService.delete(1, 1);

      expect(mockedRepo.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(existing);
    });

    it('デフォルトのデータ種類は削除できない', async () => {
      const existing = { id: 1, name: 'デフォルト', isDefault: true };
      mockedRepo.findById.mockResolvedValue(existing as never);

      await expect(dataTypeService.delete(1, 1)).rejects.toThrow(
        'デフォルトのデータ種類は削除できません',
      );

      expect(mockedRepo.remove).not.toHaveBeenCalled();
    });

    it('存在しないデータ種類の場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await dataTypeService.delete(1, 999);

      expect(result).toBeNull();
    });

    it('removeの結果がcount 0の場合nullを返す', async () => {
      const existing = { id: 1, name: '売上', isDefault: false };
      mockedRepo.findById.mockResolvedValue(existing as never);
      mockedRepo.remove.mockResolvedValue({ count: 0 } as never);

      const result = await dataTypeService.delete(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('updateSortOrders', () => {
    it('ソート順を一括更新する', async () => {
      const items = [
        { id: 1, sortOrder: 0 },
        { id: 2, sortOrder: 1 },
      ];
      mockedRepo.updateSortOrders.mockResolvedValue(undefined as never);

      await dataTypeService.updateSortOrders(1, items);

      expect(mockedRepo.updateSortOrders).toHaveBeenCalledWith(1, items);
    });
  });
});
