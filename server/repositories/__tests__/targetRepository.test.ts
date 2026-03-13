import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { targetRepository } from '../targetRepository';

describe('targetRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全目標を取得する', async () => {
      const mockTargets = [
        { id: 1, userId: 'user1', year: 2025, month: 1, value: 1000 },
      ];
      prismaMock.target.findMany.mockResolvedValue(mockTargets);

      const result = await targetRepository.findAll(tenantId);

      expect(prismaMock.target.findMany).toHaveBeenCalledWith({
        where: { tenantId, periodType: 'MONTHLY' },
        include: { user: true },
        orderBy: { userId: 'asc' },
      });
      expect(result).toEqual(mockTargets);
    });
  });

  describe('findByUserAndPeriod', () => {
    it('ユーザーと期間で目標を取得する', async () => {
      const mockTarget = {
        id: 1,
        userId: 'user1',
        year: 2025,
        month: 6,
        value: 500,
      };
      prismaMock.target.findFirst.mockResolvedValue(mockTarget);

      const result = await targetRepository.findByUserAndPeriod(
        'user1',
        2025,
        6,
        tenantId,
      );

      expect(prismaMock.target.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          userId: 'user1',
          year: 2025,
          month: 6,
          periodType: 'MONTHLY',
          dataTypeId: null,
        },
      });
      expect(result).toEqual(mockTarget);
    });

    it('dataTypeId付きで目標を取得する', async () => {
      prismaMock.target.findFirst.mockResolvedValue(null);

      await targetRepository.findByUserAndPeriod('user1', 2025, 6, tenantId, 1);

      expect(prismaMock.target.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          userId: 'user1',
          year: 2025,
          month: 6,
          periodType: 'MONTHLY',
          dataTypeId: 1,
        },
      });
    });
  });

  describe('findByUsersAndPeriod', () => {
    it('複数ユーザーと期間で目標を取得する', async () => {
      const mockTargets = [
        { id: 1, userId: 'user1' },
        { id: 2, userId: 'user2' },
      ];
      prismaMock.target.findMany.mockResolvedValue(mockTargets);

      const result = await targetRepository.findByUsersAndPeriod(
        ['user1', 'user2'],
        2025,
        6,
        tenantId,
      );

      expect(prismaMock.target.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ['user1', 'user2'] },
          year: 2025,
          month: 6,
          tenantId,
          periodType: 'MONTHLY',
        },
      });
      expect(result).toEqual(mockTargets);
    });
  });

  describe('findByUsersAndPeriodRange', () => {
    it('複数ユーザーと期間範囲で目標を取得する', async () => {
      prismaMock.target.findMany.mockResolvedValue([]);

      await targetRepository.findByUsersAndPeriodRange(
        ['user1'],
        2025,
        1,
        2025,
        3,
        tenantId,
      );

      expect(prismaMock.target.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ['user1'] },
          tenantId,
          periodType: 'MONTHLY',
          OR: [
            { year: 2025, month: 1 },
            { year: 2025, month: 2 },
            { year: 2025, month: 3 },
          ],
        },
      });
    });
  });

  describe('upsert', () => {
    it('既存データがない場合は新規作成する', async () => {
      prismaMock.target.findFirst.mockResolvedValue(null);
      const mockCreated = {
        id: 1,
        userId: 'user1',
        value: 500,
        year: 2025,
        month: 6,
        tenantId,
      };
      prismaMock.target.create.mockResolvedValue(mockCreated);

      const result = await targetRepository.upsert(tenantId, {
        userId: 'user1',
        value: 500,
        year: 2025,
        month: 6,
      });

      expect(prismaMock.target.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          userId: 'user1',
          year: 2025,
          month: 6,
          periodType: 'MONTHLY',
          dataTypeId: null,
        },
      });
      expect(prismaMock.target.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          value: 500,
          year: 2025,
          month: 6,
          periodType: 'MONTHLY',
          tenantId,
          dataTypeId: null,
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it('既存データがある場合は更新する', async () => {
      const existing = {
        id: 10,
        userId: 'user1',
        value: 300,
        year: 2025,
        month: 6,
      };
      prismaMock.target.findFirst.mockResolvedValue(existing);
      const mockUpdated = { ...existing, value: 500 };
      prismaMock.target.update.mockResolvedValue(mockUpdated);

      const result = await targetRepository.upsert(tenantId, {
        userId: 'user1',
        value: 500,
        year: 2025,
        month: 6,
      });

      expect(prismaMock.target.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { value: 500 },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('bulkUpsert', () => {
    it('トランザクション内で一括upsertする', async () => {
      const targets = [
        { userId: 'user1', value: 500, year: 2025, month: 1 },
        { userId: 'user2', value: 600, year: 2025, month: 1 },
      ];
      prismaMock.target.findFirst.mockResolvedValue(null);
      const mockCreated1 = { id: 1, ...targets[0], tenantId };
      const mockCreated2 = { id: 2, ...targets[1], tenantId };
      prismaMock.target.create
        .mockResolvedValueOnce(mockCreated1)
        .mockResolvedValueOnce(mockCreated2);

      const result = await targetRepository.bulkUpsert(tenantId, targets);

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
      expect(result).toEqual([mockCreated1, mockCreated2]);
    });
  });

  describe('findByYearAndDataType', () => {
    it('年度とデータタイプで目標を取得する', async () => {
      const mockTargets = [
        { id: 1, userId: 'user1', year: 2025, month: 1, value: 1000 },
      ];
      prismaMock.target.findMany.mockResolvedValue(mockTargets);

      const result = await targetRepository.findByYearAndDataType(
        tenantId,
        2025,
        1,
      );

      expect(prismaMock.target.findMany).toHaveBeenCalledWith({
        where: { tenantId, year: 2025, periodType: 'MONTHLY', dataTypeId: 1 },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ userId: 'asc' }, { month: 'asc' }],
      });
      expect(result).toEqual(mockTargets);
    });

    it('dataTypeIdが未指定の場合nullで検索する', async () => {
      prismaMock.target.findMany.mockResolvedValue([]);

      await targetRepository.findByYearAndDataType(tenantId, 2025);

      expect(prismaMock.target.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          year: 2025,
          periodType: 'MONTHLY',
          dataTypeId: null,
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ userId: 'asc' }, { month: 'asc' }],
      });
    });
  });
});
