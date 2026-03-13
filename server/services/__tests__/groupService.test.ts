import { describe, it, expect, beforeEach, vi } from 'vitest';
import { groupService } from '../groupService';
import { groupRepository } from '../../repositories/groupRepository';

vi.mock('../../repositories/groupRepository');

const mockedRepo = vi.mocked(groupRepository);

describe('groupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('グループ一覧を現在所属中メンバー数付きで返す', async () => {
      mockedRepo.findAll.mockResolvedValue([
        {
          id: 1,
          name: 'チームA',
          imageUrl: 'https://example.com/img.png',
          managerId: 10,
          members: [
            { endMonth: null, user: { id: 'u1', name: '田中' } },
            { endMonth: new Date('2024-03-01'), user: { id: 'u2', name: '佐藤' } },
            { endMonth: null, user: { id: 'u3', name: '鈴木' } },
          ],
        },
      ] as never);

      const result = await groupService.getAll(1);

      expect(result).toHaveLength(1);
      expect(result[0].members).toBe(2);
      expect(result[0].memberList).toEqual([
        { id: 'u1', name: '田中' },
        { id: 'u3', name: '鈴木' },
      ]);
    });
  });

  describe('getById', () => {
    it('グループをIDで取得する', async () => {
      const mockGroup = { id: 1, name: 'チームA' };
      mockedRepo.findById.mockResolvedValue(mockGroup as never);

      const result = await groupService.getById(1, 1);

      expect(mockedRepo.findById).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('getMemberIdsByMonth', () => {
    it('指定月のメンバーIDリストを返す', async () => {
      mockedRepo.findMembersByMonth.mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
      ] as never);

      const month = new Date('2024-06-01');
      const result = await groupService.getMemberIdsByMonth(1, 1, month);

      expect(mockedRepo.findMembersByMonth).toHaveBeenCalledWith(1, 1, month);
      expect(result).toEqual(['u1', 'u2']);
    });
  });

  describe('getMemberIdsByDateRange', () => {
    it('期間内のメンバーIDリストを重複なしで返す', async () => {
      mockedRepo.findMembersByDateRange.mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u1' },
      ] as never);

      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = await groupService.getMemberIdsByDateRange(1, 1, start, end);

      expect(result).toEqual(['u1', 'u2']);
    });
  });

  describe('getCurrentMemberIds', () => {
    it('現在のメンバーIDリストを返す', async () => {
      mockedRepo.findCurrentMembers.mockResolvedValue([
        { user: { id: 'u1' } },
        { user: { id: 'u2' } },
      ] as never);

      const result = await groupService.getCurrentMemberIds(1, 1);

      expect(result).toEqual(['u1', 'u2']);
    });
  });

  describe('getMemberHistory', () => {
    it('グループのメンバー履歴を返す', async () => {
      const mockHistory = [{ id: 1, userId: 'u1' }];
      mockedRepo.findAllMemberHistory.mockResolvedValue(mockHistory as never);

      const result = await groupService.getMemberHistory(1, 1);

      expect(mockedRepo.findAllMemberHistory).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('create', () => {
    it('新しいグループを作成する', async () => {
      const created = { id: 1, name: '新グループ' };
      mockedRepo.create.mockResolvedValue(created as never);

      const result = await groupService.create(1, { name: '新グループ' });

      expect(mockedRepo.create).toHaveBeenCalledWith(1, { name: '新グループ' });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('グループを更新して返す', async () => {
      const updated = { id: 1, name: '更新後' };
      mockedRepo.update.mockResolvedValue(undefined as never);
      mockedRepo.findById.mockResolvedValue(updated as never);

      const result = await groupService.update(1, 1, { name: '更新後' });

      expect(mockedRepo.update).toHaveBeenCalledWith(1, 1, { name: '更新後' });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('存在するグループを削除して返す', async () => {
      const existing = { id: 1, name: 'グループ' };
      mockedRepo.findById.mockResolvedValue(existing as never);
      mockedRepo.delete.mockResolvedValue(undefined as never);

      const result = await groupService.delete(1, 1);

      expect(mockedRepo.delete).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(existing);
    });

    it('存在しないグループの場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await groupService.delete(1, 999);

      expect(result).toBeNull();
      expect(mockedRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('syncMembers', () => {
    it('メンバー同期を実行する', async () => {
      mockedRepo.syncMembers.mockResolvedValue(undefined as never);
      const startMonth = new Date('2024-06-01');

      await groupService.syncMembers(1, 1, ['u1', 'u2'], startMonth);

      expect(mockedRepo.syncMembers).toHaveBeenCalledWith(1, 1, ['u1', 'u2'], startMonth);
    });

    it('startMonthが未指定の場合今月の1日が使われる', async () => {
      mockedRepo.syncMembers.mockResolvedValue(undefined as never);

      await groupService.syncMembers(1, 1, ['u1']);

      expect(mockedRepo.syncMembers).toHaveBeenCalledWith(
        1, 1, ['u1'],
        expect.any(Date),
      );
    });
  });

  describe('addMember', () => {
    it('メンバーを追加する', async () => {
      mockedRepo.addMember.mockResolvedValue({ id: 1 } as never);
      const startMonth = new Date('2024-06-01');

      await groupService.addMember(1, 1, 'u1', startMonth);

      expect(mockedRepo.addMember).toHaveBeenCalledWith(1, 1, 'u1', startMonth);
    });
  });

  describe('endMembership', () => {
    it('所属を終了する', async () => {
      mockedRepo.endMembership.mockResolvedValue({ id: 1 } as never);
      const endMonth = new Date('2024-12-01');

      await groupService.endMembership(1, 1, endMonth);

      expect(mockedRepo.endMembership).toHaveBeenCalledWith(1, 1, endMonth);
    });
  });

  describe('removeMembership', () => {
    it('所属を削除する', async () => {
      mockedRepo.removeMembership.mockResolvedValue({ id: 1 } as never);

      await groupService.removeMembership(1, 1);

      expect(mockedRepo.removeMembership).toHaveBeenCalledWith(1, 1);
    });
  });
});
