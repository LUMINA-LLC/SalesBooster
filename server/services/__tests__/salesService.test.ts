import { describe, it, expect, beforeEach, vi } from 'vitest';
import { salesService } from '../salesService';
import { salesRecordRepository } from '../../repositories/salesRecordRepository';
import { memberRepository } from '../../repositories/memberRepository';
import { targetRepository } from '../../repositories/targetRepository';
import { dataTypeRepository } from '../../repositories/dataTypeRepository';

vi.mock('../../repositories/salesRecordRepository');
vi.mock('../../repositories/memberRepository');
vi.mock('../../repositories/targetRepository');
vi.mock('../../repositories/dataTypeRepository');
vi.mock('@/lib/currency', () => ({
  convertByUnit: vi.fn((value: number) => value),
}));

const mockedSalesRepo = vi.mocked(salesRecordRepository);
const mockedMemberRepo = vi.mocked(memberRepository);
const mockedTargetRepo = vi.mocked(targetRepository);
const mockedDataTypeRepo = vi.mocked(dataTypeRepository);

// テスト用ヘルパー: 共通のモックセットアップ
function setupCommonMocks(options?: {
  dataTypeId?: number;
  userIds?: string[];
}) {
  const users = [
    { id: 'u1', name: '田中', imageUrl: null, department: { name: '営業' } },
    { id: 'u2', name: '佐藤', imageUrl: 'img.png', department: null },
  ];

  if (options?.dataTypeId) {
    mockedDataTypeRepo.findById.mockResolvedValue({
      unit: 'YEN',
      id: options.dataTypeId,
    } as never);
  }

  if (options?.userIds) {
    mockedMemberRepo.findByIds.mockResolvedValue(
      users.filter((u) => options.userIds!.includes(u.id)) as never,
    );
  } else {
    mockedMemberRepo.findAll.mockResolvedValue(users as never);
  }

  mockedTargetRepo.findByUsersAndPeriodRange.mockResolvedValue([
    { userId: 'u1', value: 1000, dataTypeId: null },
    { userId: 'u2', value: 2000, dataTypeId: null },
  ] as never);
  mockedTargetRepo.findByUsersAndPeriod.mockResolvedValue([
    { userId: 'u1', value: 500, dataTypeId: null },
    { userId: 'u2', value: 800, dataTypeId: null },
  ] as never);

  return users;
}

function createRecord(userId: string, value: number, recordDate: string) {
  return {
    userId,
    value,
    recordDate: new Date(recordDate),
    user: {
      name: userId === 'u1' ? '田中' : '佐藤',
      imageUrl: null,
      department: null,
    },
    dataType: { id: 1, name: '売上', unit: 'MAN_YEN' },
    id: Math.random(),
    createdAt: new Date(recordDate),
  };
}

describe('salesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== CRUD系テスト ======

  describe('createSalesRecord', () => {
    it('売上レコードを作成する', async () => {
      const data = {
        userId: 'u1',
        value: 1000,
        description: 'テスト売上',
        recordDate: new Date('2024-06-15'),
      };
      const created = { id: 1, ...data };
      mockedSalesRepo.create.mockResolvedValue(created as never);

      const result = await salesService.createSalesRecord(1, data);

      expect(mockedSalesRepo.create).toHaveBeenCalledWith(1, data);
      expect(result).toEqual(created);
    });
  });

  describe('updateSalesRecord', () => {
    it('存在するレコードを更新して返す', async () => {
      const existing = { id: 1, value: 1000 };
      const updated = { id: 1, value: 2000 };
      mockedSalesRepo.findById.mockResolvedValueOnce(existing as never);
      mockedSalesRepo.update.mockResolvedValue(undefined as never);
      mockedSalesRepo.findById.mockResolvedValueOnce(updated as never);

      const result = await salesService.updateSalesRecord(1, 1, {
        value: 2000,
      });

      expect(mockedSalesRepo.update).toHaveBeenCalledWith(1, 1, {
        value: 2000,
      });
      expect(result).toEqual(updated);
    });

    it('存在しないレコードの場合nullを返す', async () => {
      mockedSalesRepo.findById.mockResolvedValue(null as never);
      const result = await salesService.updateSalesRecord(1, 999, {
        value: 2000,
      });
      expect(result).toBeNull();
      expect(mockedSalesRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteSalesRecord', () => {
    it('存在するレコードを削除して元データを返す', async () => {
      const existing = { id: 1, value: 1000 };
      mockedSalesRepo.findById.mockResolvedValue(existing as never);
      mockedSalesRepo.remove.mockResolvedValue(undefined as never);

      const result = await salesService.deleteSalesRecord(1, 1);

      expect(mockedSalesRepo.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(existing);
    });

    it('存在しないレコードの場合nullを返す', async () => {
      mockedSalesRepo.findById.mockResolvedValue(null as never);
      const result = await salesService.deleteSalesRecord(1, 999);
      expect(result).toBeNull();
      expect(mockedSalesRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('getSalesRecords', () => {
    it('ページネーション付きで売上レコードを返す', async () => {
      mockedSalesRepo.findPaginated.mockResolvedValue({
        records: [
          {
            id: 1,
            userId: 'u1',
            user: { name: '田中', department: { name: '営業部' } },
            value: 1000,
            dataTypeId: 1,
            dataType: { id: 1, name: '売上', unit: 'MAN_YEN' },
            description: 'テスト',
            customFields: { field1: 'val1' },
            recordDate: new Date('2024-06-15'),
            createdAt: new Date('2024-06-15T10:00:00Z'),
          },
        ],
        total: 1,
      } as never);

      const result = await salesService.getSalesRecords(1, 1, 10);

      expect(result.records).toHaveLength(1);
      expect(result.records[0].memberName).toBe('田中');
      expect(result.records[0].department).toBe('営業部');
      expect(result.records[0].dataType).toEqual({
        id: 1,
        name: '売上',
        unit: 'MAN_YEN',
      });
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('totalが0でもtotalPagesは最低1になる', async () => {
      mockedSalesRepo.findPaginated.mockResolvedValue({
        records: [],
        total: 0,
      } as never);
      const result = await salesService.getSalesRecords(1, 1, 10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('importSalesRecords', () => {
    it('複数レコードを一括インポートする', async () => {
      mockedSalesRepo.createMany.mockResolvedValue({ count: 3 } as never);
      const records = [
        { userId: 'u1', value: 100, recordDate: '2024-06-01' },
        {
          userId: 'u2',
          value: 200,
          recordDate: '2024-06-02',
          description: 'メモ',
        },
        {
          userId: 'u3',
          value: 300,
          recordDate: '2024-06-03',
          customFields: { f1: 'v1' },
        },
      ];

      const result = await salesService.importSalesRecords(1, records);

      expect(mockedSalesRepo.createMany).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ userId: 'u1', value: 100 }),
          expect.objectContaining({
            userId: 'u2',
            value: 200,
            description: 'メモ',
          }),
          expect.objectContaining({
            userId: 'u3',
            value: 300,
            customFields: { f1: 'v1' },
          }),
        ]),
      );
      expect(result).toEqual({ created: 3 });
    });
  });

  describe('getAllSalesRecords', () => {
    it('全レコードをフォーマットして返す', async () => {
      mockedSalesRepo.findAll.mockResolvedValue([
        {
          id: 1,
          userId: 'u1',
          user: { name: '田中', department: null },
          value: 500,
          dataTypeId: null,
          dataType: null,
          description: null,
          customFields: null,
          recordDate: new Date('2024-06-15'),
          createdAt: new Date('2024-06-15T10:00:00Z'),
        },
      ] as never);

      const result = await salesService.getAllSalesRecords(1);

      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('田中');
      expect(result[0].department).toBeNull();
      expect(result[0].dataType).toBeNull();
    });
  });

  // ====== 統計系テスト ======

  describe('getSalesByDateRange', () => {
    it('期間内の売上データとランキングを返す', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 500 },
        { userId: 'u1', value: 300 },
        { userId: 'u2', value: 1000 },
      ] as never);

      const start = new Date('2024-06-01');
      const end = new Date('2024-06-30');
      const result = await salesService.getSalesByDateRange(1, start, end);

      expect(result.recordCount).toBe(3);
      expect(result.salesPeople).toHaveLength(2);
      expect(result.salesPeople[0].name).toBe('佐藤');
      expect(result.salesPeople[0].rank).toBe(1);
      expect(result.salesPeople[1].name).toBe('田中');
      expect(result.salesPeople[1].rank).toBe(2);
    });

    it('dataTypeId指定時はresolveUnitでunitを解決する', async () => {
      setupCommonMocks({ dataTypeId: 5 });
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 100 },
      ] as never);
      mockedTargetRepo.findByUsersAndPeriodRange.mockResolvedValue([
        { userId: 'u1', value: 500, dataTypeId: 5 },
      ] as never);

      const result = await salesService.getSalesByDateRange(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        undefined,
        5,
      );

      expect(mockedDataTypeRepo.findById).toHaveBeenCalledWith(5, 1);
      expect(result.salesPeople.length).toBeGreaterThan(0);
    });

    it('userIds指定時はfindByIdsでユーザーを絞り込む', async () => {
      setupCommonMocks({ userIds: ['u1'] });
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 500 },
      ] as never);

      const result = await salesService.getSalesByDateRange(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        ['u1'],
      );

      expect(mockedMemberRepo.findByIds).toHaveBeenCalledWith(['u1'], 1);
      expect(result.salesPeople).toHaveLength(1);
    });

    it('空のuserIds配列を渡すと0件になる', async () => {
      mockedSalesRepo.findByPeriod.mockResolvedValue([] as never);
      mockedTargetRepo.findByUsersAndPeriodRange.mockResolvedValue([] as never);

      const result = await salesService.getSalesByDateRange(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        [],
      );

      expect(mockedMemberRepo.findByIds).not.toHaveBeenCalled();
      expect(mockedMemberRepo.findAll).not.toHaveBeenCalled();
      expect(result.salesPeople).toHaveLength(0);
    });
  });

  describe('getCumulativeSales', () => {
    it('累積売上データを返す', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 500 },
        { userId: 'u2', value: 1000 },
      ] as never);

      const result = await salesService.getCumulativeSales(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('佐藤');
      expect(result[0].sales).toBe(1000);
      expect(result[1].name).toBe('田中');
      expect(result[1].sales).toBe(500);
    });

    it('dataTypeIdでフィルタリングされたtargetを使用する', async () => {
      setupCommonMocks({ dataTypeId: 3 });
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 100 },
      ] as never);
      mockedTargetRepo.findByUsersAndPeriodRange.mockResolvedValue([
        { userId: 'u1', value: 500, dataTypeId: 3 },
        { userId: 'u1', value: 200, dataTypeId: null },
      ] as never);

      const result = await salesService.getCumulativeSales(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        undefined,
        3,
      );

      // dataTypeId=3のtargetのみフィルタされるため、u1のtarget=500
      const u1 = result.find((p) => p.name === '田中');
      expect(u1).toBeDefined();
      expect(u1!.achievement).toBe(20); // 100/500 * 100
    });
  });

  describe('getTrendData', () => {
    it('月別のトレンドデータを返す', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        createRecord('u1', 500, '2024-04-15'),
        createRecord('u1', 300, '2024-05-10'),
        createRecord('u2', 700, '2024-06-20'),
      ] as never);

      const result = await salesService.getTrendData(
        1,
        new Date('2024-04-01'),
        new Date('2024-06-30'),
      );

      expect(result).toHaveLength(3);
      expect(result[0].month).toBe('2024-04');
      expect(result[0].displayMonth).toBe('4月');
      expect(result[0].sales).toBe(500);
      expect(result[1].month).toBe('2024-05');
      expect(result[1].displayMonth).toBe('5月');
      expect(result[2].month).toBe('2024-06');
      expect(result[2].displayMonth).toBe('6月');
      expect(result[2].sales).toBe(700);
    });

    it('レコードがない月は0になる', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([] as never);

      const result = await salesService.getTrendData(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
      );

      expect(result).toHaveLength(1);
      expect(result[0].sales).toBe(0);
    });
  });

  describe('getDateRange', () => {
    it('最小日付がある場合、minDateとmaxDateを返す', async () => {
      const minDate = new Date('2024-01-01');
      mockedSalesRepo.findMinDate.mockResolvedValue(minDate as never);

      const result = await salesService.getDateRange(1);

      expect(result).not.toBeNull();
      expect(result!.minDate).toEqual(minDate);
      expect(result!.maxDate).toBeInstanceOf(Date);
    });

    it('最小日付がない場合nullを返す', async () => {
      mockedSalesRepo.findMinDate.mockResolvedValue(null as never);
      const result = await salesService.getDateRange(1);
      expect(result).toBeNull();
    });
  });

  describe('getReportData', () => {
    it('レポートデータを生成する（月次トレンド、累積、曜日比、期間比、統計値）', async () => {
      setupCommonMocks();
      // 3ヶ月分のレコード（movingAvgの計算に必要）
      const records = [
        createRecord('u1', 100, '2024-04-05'), // 前半10日間, 金曜
        createRecord('u1', 200, '2024-04-15'), // 中盤10日間, 月曜
        createRecord('u2', 300, '2024-05-08'), // 前半10日間, 水曜
        createRecord('u1', 400, '2024-05-25'), // 後半10日間, 土曜
        createRecord('u2', 500, '2024-06-10'), // 前半10日間, 月曜
        createRecord('u1', 600, '2024-06-22'), // 後半10日間, 土曜
      ];
      mockedSalesRepo.findByPeriod.mockResolvedValue(records as never);

      const result = await salesService.getReportData(
        1,
        new Date('2024-04-01'),
        new Date('2024-06-30'),
      );

      // monthlyTrend
      expect(result.monthlyTrend).toHaveLength(3);
      expect(result.monthlyTrend[0].month).toBe('2024-04');
      expect(result.monthlyTrend[0].sales).toBe(300); // 100 + 200
      expect(result.monthlyTrend[0].movingAvg).toBeNull(); // i=0なので
      expect(result.monthlyTrend[1].movingAvg).toBeNull(); // i=1なので
      expect(result.monthlyTrend[2].movingAvg).toBeDefined(); // i=2で3ヶ月移動平均

      // cumulativeTrend
      expect(result.cumulativeTrend).toHaveLength(3);
      expect(result.cumulativeTrend[0].cumulative).toBe(300);
      expect(result.cumulativeTrend[1].cumulative).toBe(1000); // 300+700
      expect(result.cumulativeTrend[2].cumulative).toBe(2100); // 1000+1100

      // dayOfWeekRatio
      expect(result.dayOfWeekRatio).toHaveLength(7);
      const totalRatio = result.dayOfWeekRatio.reduce(
        (sum, d) => sum + d.ratio,
        0,
      );
      // 合計が100前後（丸め誤差）
      expect(totalRatio).toBeGreaterThanOrEqual(95);
      expect(totalRatio).toBeLessThanOrEqual(105);

      // periodRatio
      expect(result.periodRatio).toHaveLength(3);
      expect(result.periodRatio[0].period).toBe('前半10日間');
      expect(result.periodRatio[1].period).toBe('中盤10日間');
      expect(result.periodRatio[2].period).toBe('後半10日間');

      // stats
      expect(result.stats).toHaveProperty('monthlyAvg');
      expect(result.stats).toHaveProperty('dailyAvg');
      expect(result.stats).toHaveProperty('targetDays');
      expect(result.stats).toHaveProperty('targetMonths');
      expect(result.stats).toHaveProperty('landingPrediction');
      expect(result.stats).toHaveProperty('landingMonth');
    });

    it('レコードが空の場合でもエラーなくレポートを生成する', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([] as never);

      const result = await salesService.getReportData(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
      );

      expect(result.monthlyTrend).toHaveLength(1);
      expect(result.monthlyTrend[0].sales).toBe(0);
      expect(result.stats.monthlyAvg).toBe(0);
      expect(result.stats.dailyAvg).toBe(0);
    });

    it('dataTypeId指定時にtargetをフィルタリングする', async () => {
      setupCommonMocks({ dataTypeId: 2 });
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        createRecord('u1', 100, '2024-06-15'),
      ] as never);
      mockedTargetRepo.findByUsersAndPeriod.mockResolvedValue([
        { userId: 'u1', value: 500, dataTypeId: 2 },
        { userId: 'u1', value: 300, dataTypeId: null },
      ] as never);

      const result = await salesService.getReportData(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        undefined,
        2,
      );

      expect(result.stats).toBeDefined();
    });
  });

  describe('getRankingBoardData', () => {
    it('月別＋合計のランキングデータを返す', async () => {
      setupCommonMocks();
      const records = [
        createRecord('u1', 500, '2024-05-15'),
        createRecord('u2', 800, '2024-05-20'),
        createRecord('u1', 1000, '2024-06-10'),
        createRecord('u2', 300, '2024-06-25'),
      ];
      mockedSalesRepo.findByPeriod.mockResolvedValue(records as never);

      const result = await salesService.getRankingBoardData(
        1,
        new Date('2024-05-01'),
        new Date('2024-06-30'),
      );

      // columns: TOTAL + 月別（新しい月から）
      expect(result.columns.length).toBe(3); // TOTAL + 2024-06 + 2024-05
      expect(result.columns[0].label).toBe('TOTAL');
      expect(result.columns[0].isTotal).toBe(true);
      expect(result.columns[0].subLabel).toContain('〜');

      // TOTALランキング: u1(1500) > u2(1100)
      expect(result.columns[0].members).toHaveLength(2);
      expect(result.columns[0].members[0].rank).toBe(1);
      expect(result.columns[0].members[0].name).toBe('田中');
      expect(result.columns[0].members[0].amount).toBe(1500);
      expect(result.columns[0].members[1].rank).toBe(2);
      expect(result.columns[0].members[1].name).toBe('佐藤');

      // 月別カラム（新しい順）
      expect(result.columns[1].isTotal).toBe(false);
      expect(result.columns[2].isTotal).toBe(false);
    });

    it('売上0のユーザーはランキングに含まれない', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        createRecord('u1', 500, '2024-06-15'),
      ] as never);

      const result = await salesService.getRankingBoardData(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
      );

      // u2は売上0なのでランキングに含まれない
      expect(result.columns[0].members).toHaveLength(1);
      expect(result.columns[0].members[0].name).toBe('田中');
    });
  });

  describe('getPreviousPeriodAverage', () => {
    it('前月タイプの場合、前月のデータで1人あたり平均を計算する', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 600 },
        { userId: 'u2', value: 400 },
      ] as never);

      const result = await salesService.getPreviousPeriodAverage(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        'prev_month',
      );

      // (600 + 400) / 2 = 500
      expect(result).toBe(500);
      // 前月の期間でfindByPeriodが呼ばれている
      expect(mockedSalesRepo.findByPeriod).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        1,
        undefined,
        undefined,
      );
    });

    it('前年タイプの場合、前年同月のデータで計算する', async () => {
      setupCommonMocks();
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 1000 },
      ] as never);

      const result = await salesService.getPreviousPeriodAverage(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        'prev_year',
      );

      // 1000 / 2 = 500
      expect(result).toBe(500);
    });

    it('ユーザーが0人の場合は0を返す', async () => {
      mockedMemberRepo.findAll.mockResolvedValue([] as never);
      mockedSalesRepo.findByPeriod.mockResolvedValue([] as never);

      const result = await salesService.getPreviousPeriodAverage(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        'prev_month',
      );

      expect(result).toBe(0);
    });

    it('dataTypeId指定時にresolveUnitが呼ばれる', async () => {
      setupCommonMocks({ dataTypeId: 3 });
      mockedSalesRepo.findByPeriod.mockResolvedValue([
        { userId: 'u1', value: 300 },
      ] as never);

      await salesService.getPreviousPeriodAverage(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        'prev_month',
        undefined,
        3,
      );

      expect(mockedDataTypeRepo.findById).toHaveBeenCalledWith(3, 1);
    });
  });

  describe('getBreakingNewsData', () => {
    it('速報データ（レコード総数＋最新N件）を返す', async () => {
      mockedSalesRepo.countByPeriod.mockResolvedValue(50 as never);
      mockedSalesRepo.findLatest.mockResolvedValue([
        {
          id: 1,
          user: { name: '田中', imageUrl: 'img1.png' },
          value: 1000,
          dataType: { unit: 'MAN_YEN', name: '売上' },
          createdAt: new Date('2024-06-15T10:00:00Z'),
        },
        {
          id: 2,
          user: { name: '佐藤', imageUrl: null },
          value: 500,
          dataType: null,
          createdAt: new Date('2024-06-15T09:00:00Z'),
        },
      ] as never);

      const result = await salesService.getBreakingNewsData(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        5,
      );

      expect(result.recordCount).toBe(50);
      expect(result.latest).toHaveLength(2);
      expect(result.latest[0].memberName).toBe('田中');
      expect(result.latest[0].memberImageUrl).toBe('img1.png');
      expect(result.latest[0].value).toBe(1000);
      expect(result.latest[0].unit).toBe('MAN_YEN');
      expect(result.latest[0].dataTypeName).toBe('売上');
      expect(result.latest[1].memberName).toBe('佐藤');
      expect(result.latest[1].memberImageUrl).toBeUndefined();
      expect(result.latest[1].unit).toBe('MAN_YEN'); // dataTypeがnullの場合のデフォルト
      expect(result.latest[1].dataTypeName).toBe('');
    });

    it('userIds指定時にリポジトリに渡す', async () => {
      mockedSalesRepo.countByPeriod.mockResolvedValue(0 as never);
      mockedSalesRepo.findLatest.mockResolvedValue([] as never);

      await salesService.getBreakingNewsData(
        1,
        new Date('2024-06-01'),
        new Date('2024-06-30'),
        3,
        ['u1'],
      );

      expect(mockedSalesRepo.countByPeriod).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        1,
        ['u1'],
      );
      expect(mockedSalesRepo.findLatest).toHaveBeenCalledWith(
        1,
        3,
        expect.any(Date),
        expect.any(Date),
        ['u1'],
      );
    });
  });
});
