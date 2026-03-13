import { describe, it, expect, beforeEach } from 'vitest';
import { DataRefreshInterval, DisplayTransition, DisplayViewType } from '@prisma/client';
import { prismaMock } from '../../__mocks__/prisma';
import { displayConfigRepository } from '../displayConfigRepository';

describe('displayConfigRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('find', () => {
    it('テナントIDで表示設定を取得する', async () => {
      const mockConfig = {
        id: 1,
        tenantId,
        loop: true,
        views: [{ id: 1, viewType: 'RANKING', enabled: true }],
      };
      prismaMock.displayConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await displayConfigRepository.find(tenantId);

      expect(prismaMock.displayConfig.findFirst).toHaveBeenCalledWith({
        where: { tenantId },
        include: { views: { orderBy: { order: 'asc' }, include: { customSlide: true } } },
      });
      expect(result).toEqual(mockConfig);
    });

    it('表示設定が存在しない場合nullを返す', async () => {
      prismaMock.displayConfig.findFirst.mockResolvedValue(null);

      const result = await displayConfigRepository.find(tenantId);

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    const viewData = {
      loop: true,
      dataRefreshInterval: DataRefreshInterval.MINUTES_5,
      filterGroupId: '',
      filterMemberId: '',
      transition: DisplayTransition.SLIDE_LEFT,
      companyLogoUrl: '',
      teamName: 'Team A',
      darkMode: false,
      breakingNewsMessage: '',
      views: [
        {
          viewType: DisplayViewType.RECORD,
          enabled: true,
          duration: 10,
          order: 0,
          title: 'ランキング',
        },
      ],
    };

    it('既存設定がない場合は新規作成する', async () => {
      prismaMock.displayConfig.findFirst.mockResolvedValue(null);
      const mockCreated = { id: 1, tenantId, ...viewData };
      prismaMock.displayConfig.create.mockResolvedValue(mockCreated);

      const result = await displayConfigRepository.upsert(tenantId, viewData);

      expect(prismaMock.displayConfig.findFirst).toHaveBeenCalledWith({ where: { tenantId } });
      expect(prismaMock.displayConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          loop: true,
          teamName: 'Team A',
          views: {
            create: expect.arrayContaining([
              expect.objectContaining({ viewType: DisplayViewType.RECORD, enabled: true }),
            ]),
          },
        }),
        include: { views: { orderBy: { order: 'asc' }, include: { customSlide: true } } },
      });
      expect(result).toEqual(mockCreated);
    });

    it('既存設定がある場合はトランザクションで更新する', async () => {
      const existing = { id: 10, tenantId };
      prismaMock.displayConfig.findFirst.mockResolvedValue(existing);
      prismaMock.displayConfigView.deleteMany.mockResolvedValue({ count: 1 });
      const mockUpdated = { id: 10, tenantId, ...viewData };
      prismaMock.displayConfig.update.mockResolvedValue(mockUpdated);

      const result = await displayConfigRepository.upsert(tenantId, viewData);

      expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(prismaMock.displayConfigView.deleteMany).toHaveBeenCalledWith({
        where: { displayConfigId: 10 },
      });
      expect(prismaMock.displayConfig.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: expect.objectContaining({
          loop: true,
          teamName: 'Team A',
          views: {
            create: expect.arrayContaining([
              expect.objectContaining({ viewType: DisplayViewType.RECORD, enabled: true }),
            ]),
          },
        }),
        include: { views: { orderBy: { order: 'asc' }, include: { customSlide: true } } },
      });
      expect(result).toEqual(mockUpdated);
    });
  });
});
