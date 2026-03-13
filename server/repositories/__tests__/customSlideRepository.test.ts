import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { customSlideRepository } from '../customSlideRepository';

describe('customSlideRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全カスタムスライドを取得する', async () => {
      const mockSlides = [{ id: 1, title: 'Slide1', tenantId }];
      prismaMock.customSlide.findMany.mockResolvedValue(mockSlides);

      const result = await customSlideRepository.findAll(tenantId);

      expect(prismaMock.customSlide.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockSlides);
    });
  });

  describe('findById', () => {
    it('IDとテナントIDでカスタムスライドを取得する', async () => {
      const mockSlide = { id: 1, title: 'Slide1', tenantId };
      prismaMock.customSlide.findFirst.mockResolvedValue(mockSlide);

      const result = await customSlideRepository.findById(1, tenantId);

      expect(prismaMock.customSlide.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual(mockSlide);
    });
  });

  describe('count', () => {
    it('テナントIDでカスタムスライド数をカウントする', async () => {
      prismaMock.customSlide.count.mockResolvedValue(3);

      const result = await customSlideRepository.count(tenantId);

      expect(prismaMock.customSlide.count).toHaveBeenCalledWith({
        where: { tenantId },
      });
      expect(result).toBe(3);
    });
  });

  describe('create', () => {
    it('カスタムスライドを作成する', async () => {
      const data = {
        slideType: 'TEXT' as const,
        title: 'New Slide',
        content: 'Content',
      };
      const mockCreated = { id: 1, ...data, tenantId };
      prismaMock.customSlide.create.mockResolvedValue(mockCreated);

      const result = await customSlideRepository.create(tenantId, data);

      expect(prismaMock.customSlide.create).toHaveBeenCalledWith({
        data: { ...data, tenantId },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('カスタムスライドを更新する', async () => {
      const data = { title: 'Updated Slide' };
      prismaMock.customSlide.updateMany.mockResolvedValue({ count: 1 });

      const result = await customSlideRepository.update(1, tenantId, data);

      expect(prismaMock.customSlide.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('hardDelete', () => {
    it('カスタムスライドを物理削除する', async () => {
      prismaMock.customSlide.deleteMany.mockResolvedValue({ count: 1 });

      const result = await customSlideRepository.hardDelete(1, tenantId);

      expect(prismaMock.customSlide.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
