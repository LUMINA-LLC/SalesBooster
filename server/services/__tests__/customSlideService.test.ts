import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customSlideService } from '../customSlideService';
import { customSlideRepository } from '../../repositories/customSlideRepository';
import { CustomSlideType } from '@prisma/client';

vi.mock('../../repositories/customSlideRepository');

const mockedRepo = vi.mocked(customSlideRepository);

describe('customSlideService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('テナントの全スライドを返す', async () => {
      const mockSlides = [{ id: 1, title: 'スライド1' }];
      mockedRepo.findAll.mockResolvedValue(mockSlides as never);

      const result = await customSlideService.getAll(1);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSlides);
    });
  });

  describe('create', () => {
    it('上限未満の場合スライドを作成する', async () => {
      mockedRepo.count.mockResolvedValue(5);
      mockedRepo.create.mockResolvedValue({ id: 1, title: '新スライド' } as never);

      const result = await customSlideService.create(1, {
        slideType: 'TEXT' as CustomSlideType,
        title: '新スライド',
        content: 'コンテンツ',
      });

      expect(mockedRepo.create).toHaveBeenCalledWith(1, {
        slideType: 'TEXT',
        title: '新スライド',
        content: 'コンテンツ',
        imageUrl: undefined,
      });
      expect(result).toEqual({ id: 1, title: '新スライド' });
    });

    it('上限（10件）に達している場合エラーをスローする', async () => {
      mockedRepo.count.mockResolvedValue(10);

      await expect(
        customSlideService.create(1, {
          slideType: 'TEXT' as CustomSlideType,
          title: 'テスト',
          content: 'テスト',
        }),
      ).rejects.toThrow('カスタムスライドは最大10件までです');

      expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('imageUrlが渡された場合含めて作成する', async () => {
      mockedRepo.count.mockResolvedValue(0);
      mockedRepo.create.mockResolvedValue({ id: 1 } as never);

      await customSlideService.create(1, {
        slideType: 'IMAGE' as CustomSlideType,
        title: '画像スライド',
        content: '',
        imageUrl: 'https://example.com/img.png',
      });

      expect(mockedRepo.create).toHaveBeenCalledWith(1, expect.objectContaining({
        imageUrl: 'https://example.com/img.png',
      }));
    });
  });

  describe('update', () => {
    it('存在するスライドを更新して返す', async () => {
      const existing = { id: 1, title: '旧タイトル' };
      const updated = { id: 1, title: '新タイトル' };
      mockedRepo.findById.mockResolvedValueOnce(existing as never);
      mockedRepo.update.mockResolvedValue(undefined as never);
      mockedRepo.findById.mockResolvedValueOnce(updated as never);

      const result = await customSlideService.update(1, 1, { title: '新タイトル' });

      expect(mockedRepo.update).toHaveBeenCalledWith(1, 1, { title: '新タイトル' });
      expect(result).toEqual(updated);
    });

    it('存在しないスライドの場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await customSlideService.update(1, 999, { title: '新タイトル' });

      expect(result).toBeNull();
      expect(mockedRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('存在するスライドを削除して元のデータを返す', async () => {
      const existing = { id: 1, title: 'スライド' };
      mockedRepo.findById.mockResolvedValue(existing as never);
      mockedRepo.hardDelete.mockResolvedValue(undefined as never);

      const result = await customSlideService.delete(1, 1);

      expect(mockedRepo.hardDelete).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(existing);
    });

    it('存在しないスライドの場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await customSlideService.delete(1, 999);

      expect(result).toBeNull();
      expect(mockedRepo.hardDelete).not.toHaveBeenCalled();
    });
  });
});
