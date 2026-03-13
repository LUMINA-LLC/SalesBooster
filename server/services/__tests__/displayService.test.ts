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
      dataRefreshInterval: 'MINUTES_5',
      filter: { groupId: '', memberId: '' },
      transition: 'SLIDE_LEFT',
      companyLogoUrl: '',
      teamName: '',
      darkMode: false,
      breakingNewsMessage: '',
      views: [
        {
          viewType: 'RECORD',
          enabled: true,
          duration: 10,
          order: 0,
          title: '',
        },
        {
          viewType: 'PERIOD_GRAPH',
          enabled: true,
          duration: 10,
          order: 1,
          title: '',
        },
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
        dataRefreshInterval: 'MINUTES_10',
        filterGroupId: '1',
        filterMemberId: 'user-1',
        transition: 'FADE',
        companyLogoUrl: 'https://example.com/logo.png',
        teamName: 'チームA',
        darkMode: true,
        breakingNewsMessage: '速報テスト',
        views: [
          {
            viewType: 'RECORD',
            enabled: true,
            duration: 15,
            order: 0,
            title: 'ランキング',
            customSlideId: null,
            customSlide: null,
            dataTypeId: '1',
            numberBoardMetrics: 'TOTAL,AVG',
            numberBoardMetricConfigs: JSON.stringify([{ metric: 'TOTAL' }]),
            periodMode: 'YTD',
            periodStartMonth: '2025-01',
            periodEndMonth: '2025-12',
          },
        ],
      } as never);

      const result = await displayService.getConfig(1);

      expect(result.loop).toBe(false);
      expect(result.filter.groupId).toBe('1');
      expect(result.filter.memberId).toBe('user-1');
      expect(result.transition).toBe('FADE');
      expect(result.companyLogoUrl).toBe('https://example.com/logo.png');
      expect(result.teamName).toBe('チームA');
      expect(result.darkMode).toBe(true);
      expect(result.breakingNewsMessage).toBe('速報テスト');
      // DBに存在するビュー + デフォルトにあるが DB にないビューがマージされる
      expect(result.views.length).toBeGreaterThanOrEqual(1);
      expect(result.views[0].numberBoardMetrics).toEqual(['TOTAL', 'AVG']);
      expect(result.views[0].numberBoardMetricConfigs).toEqual([
        { metric: 'TOTAL' },
      ]);
    });

    it('numberBoardMetricConfigsが不正なJSONの場合undefinedになる', async () => {
      mockedRepo.find.mockResolvedValue({
        loop: true,
        dataRefreshInterval: 'MINUTES_5',
        filterGroupId: '',
        filterMemberId: '',
        transition: 'SLIDE_LEFT',
        companyLogoUrl: '',
        teamName: '',
        darkMode: false,
        breakingNewsMessage: '',
        views: [
          {
            viewType: 'RECORD',
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
        dataRefreshInterval: 'MINUTES_5',
        filter: { groupId: '', memberId: '' },
        transition: 'SLIDE_LEFT',
        companyLogoUrl: '',
        teamName: 'チーム',
        darkMode: false,
        breakingNewsMessage: '速報',
        views: [
          {
            viewType: 'RECORD',
            enabled: true,
            duration: 10,
            order: 0,
            title: 'ランキング',
            customSlideId: null,
            dataTypeId: '1',
            numberBoardMetrics: ['TOTAL_SALES', 'TOTAL_COUNT'],
            numberBoardMetricConfigs: [{ metric: 'TOTAL_SALES' }],
            periodMode: 'YTD',
            periodStartMonth: '2025-01',
            periodEndMonth: '2025-12',
          },
        ],
      });

      expect(mockedRepo.upsert).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          loop: true,
          teamName: 'チーム',
          breakingNewsMessage: '速報',
          views: expect.arrayContaining([
            expect.objectContaining({
              viewType: 'RECORD',
              numberBoardMetrics: 'TOTAL_SALES,TOTAL_COUNT',
            }),
          ]),
        }),
      );
    });
  });
});
