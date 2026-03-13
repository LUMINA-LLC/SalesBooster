import { describe, it, expect, beforeEach, vi } from 'vitest';
import { displayService } from '../displayService';
import { displayConfigRepository } from '../../repositories/displayConfigRepository';

vi.mock('../../repositories/displayConfigRepository');
vi.mock('@/types/display', async () => {
  const actual = await vi.importActual('@/types/display');
  return {
    ...actual,
    DEFAULT_DISPLAY_CONFIG: {
      loop: true,
      dataRefreshInterval: 300,
      filter: { groupId: null, memberId: null },
      transition: 'SLIDE',
      companyLogoUrl: null,
      teamName: '',
      darkMode: false,
      breakingNewsMessage: '',
      views: [
        { viewType: 'RANKING', enabled: true, duration: 10, order: 0 },
        { viewType: 'CHART', enabled: true, duration: 10, order: 1 },
      ],
    },
  };
});

const mockedRepo = vi.mocked(displayConfigRepository);

describe('displayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('DBにレコードがない場合デフォルト設定を返す', async () => {
      mockedRepo.find.mockResolvedValue(null);

      const result = await displayService.getConfig(1);

      expect(mockedRepo.find).toHaveBeenCalledWith(1);
      expect(result.loop).toBe(true);
      expect(result.views).toHaveLength(2);
    });

    it('DBにレコードがある場合変換して返す', async () => {
      mockedRepo.find.mockResolvedValue({
        loop: false,
        dataRefreshInterval: 600,
        filterGroupId: 1,
        filterMemberId: 'user-1',
        transition: 'FADE',
        companyLogoUrl: 'https://example.com/logo.png',
        teamName: 'チームA',
        darkMode: true,
        breakingNewsMessage: '速報テスト',
        views: [
          {
            viewType: 'RANKING',
            enabled: true,
            duration: 15,
            order: 0,
            title: 'ランキング',
            customSlideId: null,
            customSlide: null,
            dataTypeId: '1',
            numberBoardMetrics: 'TOTAL,AVG',
            numberBoardMetricConfigs: JSON.stringify([{ metric: 'TOTAL' }]),
            periodMode: 'MONTHLY',
            periodStartMonth: 1,
            periodEndMonth: 12,
          },
        ],
      } as never);

      const result = await displayService.getConfig(1);

      expect(result.loop).toBe(false);
      expect(result.dataRefreshInterval).toBe(600);
      expect(result.filter.groupId).toBe(1);
      expect(result.filter.memberId).toBe('user-1');
      expect(result.transition).toBe('FADE');
      expect(result.companyLogoUrl).toBe('https://example.com/logo.png');
      expect(result.teamName).toBe('チームA');
      expect(result.darkMode).toBe(true);
      expect(result.breakingNewsMessage).toBe('速報テスト');
      // DBに存在するビュー + デフォルトにあるが DB にないビューがマージされる
      expect(result.views.length).toBeGreaterThanOrEqual(1);
      expect(result.views[0].numberBoardMetrics).toEqual(['TOTAL', 'AVG']);
      expect(result.views[0].numberBoardMetricConfigs).toEqual([{ metric: 'TOTAL' }]);
    });

    it('numberBoardMetricConfigsが不正なJSONの場合undefinedになる', async () => {
      mockedRepo.find.mockResolvedValue({
        loop: true,
        dataRefreshInterval: 300,
        filterGroupId: null,
        filterMemberId: null,
        transition: 'SLIDE',
        companyLogoUrl: null,
        teamName: '',
        darkMode: false,
        breakingNewsMessage: '',
        views: [
          {
            viewType: 'RANKING',
            enabled: true,
            duration: 10,
            order: 0,
            title: '',
            customSlideId: null,
            customSlide: null,
            dataTypeId: '',
            numberBoardMetrics: null,
            numberBoardMetricConfigs: '不正なJSON{{{',
            periodMode: null,
            periodStartMonth: null,
            periodEndMonth: null,
          },
        ],
      } as never);

      const result = await displayService.getConfig(1);

      expect(result.views[0].numberBoardMetricConfigs).toBeUndefined();
    });
  });

  describe('updateConfig', () => {
    it('設定をリポジトリのupsertで保存する', async () => {
      mockedRepo.upsert.mockResolvedValue(undefined as never);

      await displayService.updateConfig(1, {
        loop: true,
        dataRefreshInterval: 300,
        filter: { groupId: null, memberId: null },
        transition: 'SLIDE' as never,
        companyLogoUrl: null,
        teamName: 'チーム',
        darkMode: false,
        breakingNewsMessage: '速報',
        views: [
          {
            viewType: 'RANKING' as never,
            enabled: true,
            duration: 10,
            order: 0,
            title: 'ランキング',
            customSlideId: null,
            dataTypeId: '1',
            numberBoardMetrics: ['TOTAL', 'AVG'] as never,
            numberBoardMetricConfigs: [{ metric: 'TOTAL' }] as never,
            periodMode: 'MONTHLY' as never,
            periodStartMonth: 1,
            periodEndMonth: 12,
          },
        ],
      });

      expect(mockedRepo.upsert).toHaveBeenCalledWith(1, expect.objectContaining({
        loop: true,
        dataRefreshInterval: 300,
        teamName: 'チーム',
        breakingNewsMessage: '速報',
        views: expect.arrayContaining([
          expect.objectContaining({
            viewType: 'RANKING',
            numberBoardMetrics: 'TOTAL,AVG',
          }),
        ]),
      }));
    });
  });
});
