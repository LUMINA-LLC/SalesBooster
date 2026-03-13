import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { salesRecordRepository } from '../salesRecordRepository';

describe('salesRecordRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');

  describe('findByPeriod', () => {
    it('期間指定で売上レコードを取得する', async () => {
      const mockRecords = [{ id: 1, value: 100, tenantId }];
      prismaMock.salesRecord.findMany.mockResolvedValue(mockRecords);

      const result = await salesRecordRepository.findByPeriod(
        startDate,
        endDate,
        tenantId,
      );

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          recordDate: { gte: startDate, lte: endDate },
        },
        include: { user: { include: { department: true } }, dataType: true },
      });
      expect(result).toEqual(mockRecords);
    });

    it('userIdsフィルタ付きで取得する', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);

      await salesRecordRepository.findByPeriod(startDate, endDate, tenantId, [
        'user1',
      ]);

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          recordDate: { gte: startDate, lte: endDate },
          userId: { in: ['user1'] },
        },
        include: { user: { include: { department: true } }, dataType: true },
      });
    });
  });

  describe('findById', () => {
    it('IDとテナントIDで売上レコードを取得する', async () => {
      const mockRecord = { id: 1, value: 100, tenantId };
      prismaMock.salesRecord.findFirst.mockResolvedValue(mockRecord);

      const result = await salesRecordRepository.findById(1, tenantId);

      expect(prismaMock.salesRecord.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        include: { user: { include: { department: true } }, dataType: true },
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe('findPaginated', () => {
    it('ページネーション付きで売上レコードを取得する', async () => {
      const mockRecords = [{ id: 1, value: 100 }];
      prismaMock.salesRecord.findMany.mockResolvedValue(mockRecords);
      prismaMock.salesRecord.count.mockResolvedValue(1);

      const result = await salesRecordRepository.findPaginated(1, 10, tenantId);

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ records: mockRecords, total: 1 });
    });

    it('フィルタ付きでページネーション取得する', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);
      prismaMock.salesRecord.count.mockResolvedValue(0);

      await salesRecordRepository.findPaginated(2, 5, tenantId, {
        startDate,
        endDate,
        userId: 'user1',
        dataTypeId: 1,
      });

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          recordDate: { gte: startDate, lte: endDate },
          userId: 'user1',
          dataTypeId: 1,
        },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
        skip: 5,
        take: 5,
      });
    });

    it('userIds指定時（userIdなし）はin句でフィルタする', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);
      prismaMock.salesRecord.count.mockResolvedValue(0);

      await salesRecordRepository.findPaginated(1, 10, tenantId, {
        userIds: ['u1', 'u2'],
      });

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          userId: { in: ['u1', 'u2'] },
        },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findAll', () => {
    it('テナントIDで全売上レコードを取得する', async () => {
      const mockRecords = [{ id: 1, value: 100 }];
      prismaMock.salesRecord.findMany.mockResolvedValue(mockRecords);

      const result = await salesRecordRepository.findAll(tenantId);

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
      });
      expect(result).toEqual(mockRecords);
    });

    it('日付フィルタ付きで取得する', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);

      await salesRecordRepository.findAll(tenantId, { startDate, endDate });

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          recordDate: { gte: startDate, lte: endDate },
        },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
      });
    });

    it('userId指定で取得する', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);

      await salesRecordRepository.findAll(tenantId, { userId: 'user1' });

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId, userId: 'user1' },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
      });
    });

    it('userIds指定（userIdなし）でin句フィルタする', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);

      await salesRecordRepository.findAll(tenantId, { userIds: ['u1', 'u2'] });

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId, userId: { in: ['u1', 'u2'] } },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
      });
    });

    it('dataTypeId指定で取得する', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);

      await salesRecordRepository.findAll(tenantId, { dataTypeId: 3 });

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId, dataTypeId: 3 },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('売上レコードを更新する', async () => {
      const data = { value: 200 };
      prismaMock.salesRecord.updateMany.mockResolvedValue({ count: 1 });

      const result = await salesRecordRepository.update(1, tenantId, data);

      expect(prismaMock.salesRecord.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('remove', () => {
    it('売上レコードを削除する', async () => {
      prismaMock.salesRecord.deleteMany.mockResolvedValue({ count: 1 });

      const result = await salesRecordRepository.remove(1, tenantId);

      expect(prismaMock.salesRecord.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('findMinDate', () => {
    it('最古のレコード日付を取得する', async () => {
      const minDate = new Date('2024-01-01');
      prismaMock.salesRecord.aggregate.mockResolvedValue({
        _min: { recordDate: minDate },
      });

      const result = await salesRecordRepository.findMinDate(tenantId);

      expect(prismaMock.salesRecord.aggregate).toHaveBeenCalledWith({
        where: { tenantId },
        _min: { recordDate: true },
      });
      expect(result).toEqual(minDate);
    });

    it('レコードがない場合nullを返す', async () => {
      prismaMock.salesRecord.aggregate.mockResolvedValue({
        _min: { recordDate: null },
      });

      const result = await salesRecordRepository.findMinDate(tenantId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('売上レコードを作成する', async () => {
      const data = {
        userId: 'user1',
        value: 100,
        recordDate: new Date('2025-06-01'),
      };
      const mockCreated = { id: 1, ...data, tenantId };
      prismaMock.salesRecord.create.mockResolvedValue(mockCreated);

      const result = await salesRecordRepository.create(tenantId, data);

      expect(prismaMock.salesRecord.create).toHaveBeenCalledWith({
        data: { ...data, tenantId },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('countByPeriod', () => {
    it('期間内のレコード数をカウントする', async () => {
      prismaMock.salesRecord.count.mockResolvedValue(10);

      const result = await salesRecordRepository.countByPeriod(
        startDate,
        endDate,
        tenantId,
      );

      expect(prismaMock.salesRecord.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          recordDate: { gte: startDate, lte: endDate },
        },
      });
      expect(result).toBe(10);
    });
  });

  describe('findLatest', () => {
    it('最新N件のレコードを取得する', async () => {
      const mockRecords = [{ id: 1, value: 100 }];
      prismaMock.salesRecord.findMany.mockResolvedValue(mockRecords);

      const result = await salesRecordRepository.findLatest(tenantId, 5);

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      expect(result).toEqual(mockRecords);
    });

    it('日付とユーザーフィルタ付きで取得する', async () => {
      prismaMock.salesRecord.findMany.mockResolvedValue([]);

      await salesRecordRepository.findLatest(tenantId, 10, startDate, endDate, [
        'user1',
      ]);

      expect(prismaMock.salesRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          recordDate: { gte: startDate, lte: endDate },
          userId: { in: ['user1'] },
        },
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('createMany', () => {
    it('売上レコードを一括作成する', async () => {
      const data = [
        { userId: 'user1', value: 100, recordDate: new Date('2025-06-01') },
        { userId: 'user2', value: 200, recordDate: new Date('2025-06-01') },
      ];
      prismaMock.salesRecord.createMany.mockResolvedValue({ count: 2 });

      const result = await salesRecordRepository.createMany(tenantId, data);

      expect(prismaMock.salesRecord.createMany).toHaveBeenCalledWith({
        data: data.map((d) => ({ ...d, tenantId })),
      });
      expect(result).toEqual({ count: 2 });
    });
  });
});
