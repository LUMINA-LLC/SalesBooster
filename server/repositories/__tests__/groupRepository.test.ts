import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { groupRepository } from '../groupRepository';

describe('groupRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全グループを取得する', async () => {
      const mockGroups = [{ id: 1, name: 'Group1', tenantId, members: [] }];
      prismaMock.group.findMany.mockResolvedValue(mockGroups);

      const result = await groupRepository.findAll(tenantId);

      expect(prismaMock.group.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { startMonth: 'desc' },
          },
        },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual(mockGroups);
    });
  });

  describe('findById', () => {
    it('IDとテナントIDでグループを取得する', async () => {
      const mockGroup = { id: 1, name: 'Group1', tenantId, members: [] };
      prismaMock.group.findFirst.mockResolvedValue(mockGroup);

      const result = await groupRepository.findById(1, tenantId);

      expect(prismaMock.group.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        include: {
          members: {
            select: { userId: true, startMonth: true, endMonth: true },
          },
        },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('findMembersByMonth', () => {
    it('指定月時点のグループメンバーを取得する', async () => {
      const month = new Date('2025-06-01');
      const mockMembers = [{ userId: 'user1' }];
      prismaMock.groupMember.findMany.mockResolvedValue(mockMembers);

      const result = await groupRepository.findMembersByMonth(
        1,
        tenantId,
        month,
      );

      expect(prismaMock.groupMember.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 1,
          tenantId,
          startMonth: { lte: month },
          OR: [{ endMonth: null }, { endMonth: { gte: month } }],
        },
        select: { userId: true },
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('findMembersByDateRange', () => {
    it('指定期間内のグループメンバーを取得する', async () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-06-20');
      const mockMembers = [{ userId: 'user1' }];
      prismaMock.groupMember.findMany.mockResolvedValue(mockMembers);

      const result = await groupRepository.findMembersByDateRange(
        1,
        tenantId,
        startDate,
        endDate,
      );

      expect(prismaMock.groupMember.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 1,
          tenantId,
          startMonth: { lte: expect.any(Date) },
          OR: [{ endMonth: null }, { endMonth: { gte: expect.any(Date) } }],
        },
        select: { userId: true },
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('findCurrentMembers', () => {
    it('現在所属中のメンバーを取得する', async () => {
      const mockMembers = [
        { userId: 'user1', user: { id: 'user1', name: 'User1' } },
      ];
      prismaMock.groupMember.findMany.mockResolvedValue(mockMembers);

      const result = await groupRepository.findCurrentMembers(1, tenantId);

      expect(prismaMock.groupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 1, tenantId, endMonth: null },
        include: { user: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('findAllMemberHistory', () => {
    it('グループの全メンバー履歴を取得する', async () => {
      const mockMembers = [{ userId: 'user1', startMonth: new Date() }];
      prismaMock.groupMember.findMany.mockResolvedValue(mockMembers);

      const result = await groupRepository.findAllMemberHistory(1, tenantId);

      expect(prismaMock.groupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 1, tenantId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ startMonth: 'desc' }, { userId: 'asc' }],
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('create', () => {
    it('グループを作成する', async () => {
      const data = { name: 'New Group' };
      const mockCreated = { id: 1, ...data, tenantId };
      prismaMock.group.create.mockResolvedValue(mockCreated);

      const result = await groupRepository.create(tenantId, data);

      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: { ...data, tenantId },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('グループを更新する', async () => {
      const data = { name: 'Updated Group' };
      prismaMock.group.updateMany.mockResolvedValue({ count: 1 });

      const result = await groupRepository.update(1, tenantId, data);

      expect(prismaMock.group.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('delete', () => {
    it('グループを削除する', async () => {
      prismaMock.group.deleteMany.mockResolvedValue({ count: 1 });

      const result = await groupRepository.delete(1, tenantId);

      expect(prismaMock.group.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('addMember', () => {
    it('メンバーをグループに追加する', async () => {
      const startMonth = new Date('2025-04-01');
      const mockCreated = {
        id: 1,
        groupId: 1,
        userId: 'user1',
        tenantId,
        startMonth,
      };
      prismaMock.groupMember.create.mockResolvedValue(mockCreated);

      const result = await groupRepository.addMember(
        1,
        tenantId,
        'user1',
        startMonth,
      );

      expect(prismaMock.groupMember.create).toHaveBeenCalledWith({
        data: { groupId: 1, userId: 'user1', tenantId, startMonth },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('endMembership', () => {
    it('メンバーの終了月を設定する', async () => {
      const endMonth = new Date('2025-12-01');
      prismaMock.groupMember.updateMany.mockResolvedValue({ count: 1 });

      const result = await groupRepository.endMembership(1, tenantId, endMonth);

      expect(prismaMock.groupMember.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data: { endMonth },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('removeMembership', () => {
    it('メンバー所属レコードを削除する', async () => {
      prismaMock.groupMember.deleteMany.mockResolvedValue({ count: 1 });

      const result = await groupRepository.removeMembership(1, tenantId);

      expect(prismaMock.groupMember.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('syncMembers', () => {
    it('メンバーを同期する（追加・終了の一括処理）', async () => {
      const startMonth = new Date('2025-04-01');
      const currentMembers = [
        {
          id: 1,
          groupId: 1,
          userId: 'user1',
          tenantId,
          startMonth: new Date('2025-01-01'),
          endMonth: null,
        },
        {
          id: 2,
          groupId: 1,
          userId: 'user2',
          tenantId,
          startMonth: new Date('2025-01-01'),
          endMonth: null,
        },
      ];
      prismaMock.groupMember.findMany.mockResolvedValue(currentMembers);
      prismaMock.$transaction.mockResolvedValue(undefined);

      await groupRepository.syncMembers(
        1,
        tenantId,
        ['user2', 'user3'],
        startMonth,
      );

      // findManyで現在のメンバーを取得
      expect(prismaMock.groupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 1, tenantId, endMonth: null },
      });
      // $transactionが配列で呼ばれる
      expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
