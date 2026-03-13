import { describe, it, expect, beforeEach, vi } from 'vitest';
import { memberService } from '../memberService';
import { memberRepository } from '../../repositories/memberRepository';

vi.mock('../../repositories/memberRepository');

const mockedRepo = vi.mocked(memberRepository);

describe('memberService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('getAll', () => {
    it('メンバー一覧を整形して返す', async () => {
      const mockMembers = [
        {
          id: '1', name: 'User1', email: 'user1@test.com', role: 'USER', status: 'ACTIVE',
          imageUrl: null, department: { name: '営業部' }, departmentId: 1,
        },
        {
          id: '2', name: 'User2', email: 'user2@test.com', role: 'ADMIN', status: 'ACTIVE',
          imageUrl: 'img.png', department: null, departmentId: null,
        },
      ];
      mockedRepo.findAll.mockResolvedValue(mockMembers as never);

      const result = await memberService.getAll(tenantId);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual([
        { id: '1', name: 'User1', email: 'user1@test.com', role: 'USER', status: 'ACTIVE', imageUrl: null, department: '営業部', departmentId: 1 },
        { id: '2', name: 'User2', email: 'user2@test.com', role: 'ADMIN', status: 'ACTIVE', imageUrl: 'img.png', department: null, departmentId: null },
      ]);
    });
  });

  describe('getById', () => {
    it('IDでメンバーを取得する', async () => {
      const mockUser = { id: '1', name: 'User1' };
      mockedRepo.findById.mockResolvedValue(mockUser as never);

      const result = await memberService.getById(tenantId, '1');

      expect(mockedRepo.findById).toHaveBeenCalledWith('1', tenantId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('メンバーを作成する', async () => {
      const data = { name: 'New', email: 'new@test.com', password: 'pass' };
      const mockCreated = { id: '1', ...data };
      mockedRepo.create.mockResolvedValue(mockCreated as never);

      const result = await memberService.create(tenantId, data);

      expect(mockedRepo.create).toHaveBeenCalledWith(tenantId, {
        name: 'New',
        email: 'new@test.com',
        password: 'pass',
        role: undefined,
        imageUrl: undefined,
        departmentId: undefined,
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('メンバーを更新し、更新後のデータを返す', async () => {
      const data = { name: 'Updated' };
      const mockUpdated = { id: '1', name: 'Updated' };
      mockedRepo.update.mockResolvedValue({ count: 1 } as never);
      mockedRepo.findById.mockResolvedValue(mockUpdated as never);

      const result = await memberService.update(tenantId, '1', data);

      expect(mockedRepo.update).toHaveBeenCalledWith('1', tenantId, data);
      expect(mockedRepo.findById).toHaveBeenCalledWith('1', tenantId);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('存在するメンバーを削除して返す', async () => {
      const mockUser = { id: '1', name: 'User1' };
      mockedRepo.findById.mockResolvedValue(mockUser as never);
      mockedRepo.delete.mockResolvedValue({ count: 1 } as never);

      const result = await memberService.delete(tenantId, '1');

      expect(mockedRepo.findById).toHaveBeenCalledWith('1', tenantId);
      expect(mockedRepo.delete).toHaveBeenCalledWith('1', tenantId);
      expect(result).toEqual(mockUser);
    });

    it('存在しないメンバーの場合nullを返す', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      const result = await memberService.delete(tenantId, '999');

      expect(mockedRepo.findById).toHaveBeenCalledWith('999', tenantId);
      expect(mockedRepo.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('importMembers', () => {
    it('新規メンバーをインポートする', async () => {
      const members = [
        { name: 'A', email: 'a@test.com', password: 'pass1' },
        { name: 'B', email: 'b@test.com', password: 'pass2' },
      ];
      mockedRepo.findByEmails.mockResolvedValue([] as never);
      mockedRepo.create.mockResolvedValue({} as never);

      const result = await memberService.importMembers(tenantId, members);

      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('既存メールアドレスはスキップする', async () => {
      const members = [
        { name: 'A', email: 'existing@test.com', password: 'pass1' },
        { name: 'B', email: 'new@test.com', password: 'pass2' },
      ];
      mockedRepo.findByEmails.mockResolvedValue([{ email: 'existing@test.com' }] as never);
      mockedRepo.create.mockResolvedValue({} as never);

      const result = await memberService.importMembers(tenantId, members);

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].email).toBe('existing@test.com');
    });

    it('作成失敗時はエラーに記録する', async () => {
      const members = [{ name: 'A', email: 'a@test.com', password: 'pass1' }];
      mockedRepo.findByEmails.mockResolvedValue([] as never);
      mockedRepo.create.mockRejectedValue(new Error('DB error'));

      const result = await memberService.importMembers(tenantId, members);

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toBe('登録に失敗しました');
    });
  });
});
