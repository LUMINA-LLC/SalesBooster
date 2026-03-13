import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { groupTargetRepository } from '../groupTargetRepository';

describe('groupTargetRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findByYearAndDataType', () => {
    it('年度とデータタイプでグループ目標を取得する', async () => {
      const mockTargets = [{ id: 1, groupId: 1, year: 2025, month: 1, value: 1000 }];
      prismaMock.groupTarget.findMany.mockResolvedValue(mockTargets);

      const result = await groupTargetRepository.findByYearAndDataType(tenantId, 2025, 1);

      expect(prismaMock.groupTarget.findMany).toHaveBeenCalledWith({
        where: { tenantId, year: 2025, periodType: 'MONTHLY', dataTypeId: 1 },
        include: { group: { select: { id: true, name: true } } },
        orderBy: [{ groupId: 'asc' }, { month: 'asc' }],
      });
      expect(result).toEqual(mockTargets);
    });

    it('dataTypeIdが未指定の場合nullで検索する', async () => {
      prismaMock.groupTarget.findMany.mockResolvedValue([]);

      await groupTargetRepository.findByYearAndDataType(tenantId, 2025);

      expect(prismaMock.groupTarget.findMany).toHaveBeenCalledWith({
        where: { tenantId, year: 2025, periodType: 'MONTHLY', dataTypeId: null },
        include: { group: { select: { id: true, name: true } } },
        orderBy: [{ groupId: 'asc' }, { month: 'asc' }],
      });
    });
  });

  describe('upsert', () => {
    it('既存データがない場合は新規作成する', async () => {
      prismaMock.groupTarget.findFirst.mockResolvedValue(null);
      const mockCreated = { id: 1, groupId: 1, value: 500, year: 2025, month: 1, tenantId };
      prismaMock.groupTarget.create.mockResolvedValue(mockCreated);

      const result = await groupTargetRepository.upsert(tenantId, {
        groupId: 1, value: 500, year: 2025, month: 1,
      });

      expect(prismaMock.groupTarget.findFirst).toHaveBeenCalledWith({
        where: { tenantId, groupId: 1, year: 2025, month: 1, periodType: 'MONTHLY', dataTypeId: null },
      });
      expect(prismaMock.groupTarget.create).toHaveBeenCalledWith({
        data: { groupId: 1, value: 500, year: 2025, month: 1, periodType: 'MONTHLY', tenantId, dataTypeId: null },
      });
      expect(result).toEqual(mockCreated);
    });

    it('既存データがある場合は更新する', async () => {
      const existing = { id: 10, groupId: 1, value: 300, year: 2025, month: 1 };
      prismaMock.groupTarget.findFirst.mockResolvedValue(existing);
      const mockUpdated = { ...existing, value: 500 };
      prismaMock.groupTarget.update.mockResolvedValue(mockUpdated);

      const result = await groupTargetRepository.upsert(tenantId, {
        groupId: 1, value: 500, year: 2025, month: 1,
      });

      expect(prismaMock.groupTarget.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { value: 500 },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('bulkUpsert', () => {
    it('トランザクション内で一括upsertする', async () => {
      const targets = [
        { groupId: 1, value: 500, year: 2025, month: 1 },
        { groupId: 2, value: 600, year: 2025, month: 1 },
      ];
      // $transactionは関数を受け取りprismaMockをtxとして渡す
      prismaMock.groupTarget.findFirst.mockResolvedValue(null);
      const mockCreated1 = { id: 1, ...targets[0], tenantId };
      const mockCreated2 = { id: 2, ...targets[1], tenantId };
      prismaMock.groupTarget.create
        .mockResolvedValueOnce(mockCreated1)
        .mockResolvedValueOnce(mockCreated2);

      const result = await groupTargetRepository.bulkUpsert(tenantId, targets);

      expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toEqual([mockCreated1, mockCreated2]);
    });
  });
});
