import { describe, it, expect, beforeEach, vi } from 'vitest';
import { targetService } from '../targetService';
import { targetRepository } from '../../repositories/targetRepository';
import { groupTargetRepository } from '../../repositories/groupTargetRepository';

vi.mock('../../repositories/targetRepository');
vi.mock('../../repositories/groupTargetRepository');

const mockedTargetRepo = vi.mocked(targetRepository);
const mockedGroupTargetRepo = vi.mocked(groupTargetRepository);

describe('targetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('全目標をフォーマットして返す', async () => {
      mockedTargetRepo.findAll.mockResolvedValue([
        {
          id: 1,
          userId: 'u1',
          user: { name: '田中' },
          value: 1000,
          year: 2024,
          month: 6,
          dataTypeId: 1,
        },
      ] as never);

      const result = await targetService.getAll(1);

      expect(mockedTargetRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        {
          id: 1,
          userId: 'u1',
          memberName: '田中',
          value: 1000,
          year: 2024,
          month: 6,
          dataTypeId: 1,
        },
      ]);
    });
  });

  describe('upsert', () => {
    it('目標をupsertする', async () => {
      const data = { userId: 'u1', value: 500, year: 2024, month: 7 };
      mockedTargetRepo.upsert.mockResolvedValue({ id: 1, ...data } as never);

      const result = await targetService.upsert(1, data);

      expect(mockedTargetRepo.upsert).toHaveBeenCalledWith(1, data);
      expect(result).toEqual({ id: 1, ...data });
    });
  });

  describe('getByYear', () => {
    it('年ごとの目標をユーザーIDベースのマップで返す', async () => {
      mockedTargetRepo.findByYearAndDataType.mockResolvedValue([
        { userId: 'u1', user: { name: '田中' }, month: 1, value: 100 },
        { userId: 'u1', user: { name: '田中' }, month: 2, value: 200 },
        { userId: 'u2', user: { name: '佐藤' }, month: 1, value: 300 },
      ] as never);

      const result = await targetService.getByYear(1, 2024);

      expect(mockedTargetRepo.findByYearAndDataType).toHaveBeenCalledWith(1, 2024, undefined);
      expect(result).toEqual({
        u1: { userName: '田中', months: { 1: 100, 2: 200 } },
        u2: { userName: '佐藤', months: { 1: 300 } },
      });
    });

    it('dataTypeIdでフィルタリングできる', async () => {
      mockedTargetRepo.findByYearAndDataType.mockResolvedValue([]);

      await targetService.getByYear(1, 2024, 5);

      expect(mockedTargetRepo.findByYearAndDataType).toHaveBeenCalledWith(1, 2024, 5);
    });
  });

  describe('bulkUpsert', () => {
    it('複数目標を一括upsertする', async () => {
      const targets = [
        { userId: 'u1', value: 100, year: 2024, month: 1 },
        { userId: 'u2', value: 200, year: 2024, month: 1 },
      ];
      mockedTargetRepo.bulkUpsert.mockResolvedValue(undefined as never);

      await targetService.bulkUpsert(1, targets);

      expect(mockedTargetRepo.bulkUpsert).toHaveBeenCalledWith(1, targets);
    });
  });

  describe('getGroupTargetsByYear', () => {
    it('年ごとのグループ目標をグループIDベースのマップで返す', async () => {
      mockedGroupTargetRepo.findByYearAndDataType.mockResolvedValue([
        { groupId: 1, group: { name: 'チームA' }, month: 1, value: 500 },
        { groupId: 1, group: { name: 'チームA' }, month: 2, value: 600 },
        { groupId: 2, group: { name: 'チームB' }, month: 1, value: 700 },
      ] as never);

      const result = await targetService.getGroupTargetsByYear(1, 2024);

      expect(result).toEqual({
        1: { groupName: 'チームA', months: { 1: 500, 2: 600 } },
        2: { groupName: 'チームB', months: { 1: 700 } },
      });
    });
  });

  describe('upsertGroupTarget', () => {
    it('グループ目標をupsertする', async () => {
      const data = { groupId: 1, value: 1000, year: 2024, month: 6 };
      mockedGroupTargetRepo.upsert.mockResolvedValue({ id: 1, ...data } as never);

      const result = await targetService.upsertGroupTarget(1, data);

      expect(mockedGroupTargetRepo.upsert).toHaveBeenCalledWith(1, data);
      expect(result).toEqual({ id: 1, ...data });
    });
  });

  describe('bulkUpsertGroupTargets', () => {
    it('複数グループ目標を一括upsertする', async () => {
      const targets = [
        { groupId: 1, value: 500, year: 2024, month: 1 },
        { groupId: 2, value: 600, year: 2024, month: 1 },
      ];
      mockedGroupTargetRepo.bulkUpsert.mockResolvedValue(undefined as never);

      await targetService.bulkUpsertGroupTargets(1, targets);

      expect(mockedGroupTargetRepo.bulkUpsert).toHaveBeenCalledWith(1, targets);
    });
  });
});
