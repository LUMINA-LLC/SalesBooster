import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customFieldService } from '../customFieldService';
import { customFieldRepository } from '../../repositories/customFieldRepository';
import { CustomFieldType } from '@prisma/client';

vi.mock('../../repositories/customFieldRepository');

const mockedRepo = vi.mocked(customFieldRepository);

describe('customFieldService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('テナントの全カスタムフィールドを返す', async () => {
      const mockFields = [{ id: 1, name: 'フィールド1' }];
      mockedRepo.findAll.mockResolvedValue(mockFields as never);

      const result = await customFieldService.getAll(1);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFields);
    });
  });

  describe('getActive', () => {
    it('アクティブなカスタムフィールドのみ返す', async () => {
      const mockFields = [{ id: 1, name: 'フィールド1', isActive: true }];
      mockedRepo.findActive.mockResolvedValue(mockFields as never);

      const result = await customFieldService.getActive(1);

      expect(mockedRepo.findActive).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFields);
    });
  });

  describe('create', () => {
    it('sortOrderが既存の最大値+1で作成される', async () => {
      mockedRepo.findAll.mockResolvedValue([
        { id: 1, sortOrder: 2 },
        { id: 2, sortOrder: 5 },
      ] as never);
      mockedRepo.create.mockResolvedValue({ id: 3 } as never);

      await customFieldService.create(1, {
        name: '新規フィールド',
        fieldType: 'TEXT' as CustomFieldType,
        isRequired: true,
      });

      expect(mockedRepo.create).toHaveBeenCalledWith(1, {
        name: '新規フィールド',
        fieldType: 'TEXT',
        options: undefined,
        isRequired: true,
        sortOrder: 6,
      });
    });

    it('既存フィールドがない場合sortOrderは0になる', async () => {
      mockedRepo.findAll.mockResolvedValue([]);
      mockedRepo.create.mockResolvedValue({ id: 1 } as never);

      await customFieldService.create(1, {
        name: 'フィールド',
        fieldType: 'NUMBER' as CustomFieldType,
      });

      expect(mockedRepo.create).toHaveBeenCalledWith(1, {
        name: 'フィールド',
        fieldType: 'NUMBER',
        options: undefined,
        isRequired: false,
        sortOrder: 0,
      });
    });

    it('optionsが渡された場合そのまま設定される', async () => {
      mockedRepo.findAll.mockResolvedValue([]);
      mockedRepo.create.mockResolvedValue({ id: 1 } as never);

      await customFieldService.create(1, {
        name: '選択フィールド',
        fieldType: 'SELECT' as CustomFieldType,
        options: ['A', 'B', 'C'],
      });

      expect(mockedRepo.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          options: ['A', 'B', 'C'],
        }),
      );
    });
  });

  describe('update', () => {
    it('存在するフィールドを更新して返す', async () => {
      const existing = { id: 1, name: '旧名' };
      const updated = { id: 1, name: '新名' };
      mockedRepo.findById.mockResolvedValueOnce(existing as never);
      mockedRepo.update.mockResolvedValue(undefined as never);
      mockedRepo.findById.mockResolvedValueOnce(updated as never);

      const result = await customFieldService.update(1, 1, { name: '新名' });

      expect(mockedRepo.update).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ name: '新名' }),
      );
      expect(result).toEqual(updated);
    });

    it('存在しないフィールドの場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await customFieldService.update(1, 999, { name: '新名' });

      expect(result).toBeNull();
      expect(mockedRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('存在するフィールドを論理削除する', async () => {
      const existing = { id: 1, name: 'フィールド' };
      mockedRepo.findById.mockResolvedValue(existing as never);
      mockedRepo.softDelete.mockResolvedValue({
        ...existing,
        isActive: false,
      } as never);

      const result = await customFieldService.softDelete(1, 1);

      expect(mockedRepo.softDelete).toHaveBeenCalledWith(1, 1);
      expect(result).toBeTruthy();
    });

    it('存在しないフィールドの場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await customFieldService.softDelete(1, 999);

      expect(result).toBeNull();
      expect(mockedRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
