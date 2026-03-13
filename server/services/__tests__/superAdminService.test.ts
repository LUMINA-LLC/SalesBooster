import { describe, it, expect, beforeEach, vi } from 'vitest';
import { superAdminService } from '../superAdminService';
import { superAdminRepository } from '../../repositories/superAdminRepository';
import { hash } from 'bcryptjs';

vi.mock('../../repositories/superAdminRepository');
vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
}));

const mockedRepo = vi.mocked(superAdminRepository);
const mockedHash = vi.mocked(hash);

describe('superAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHash.mockResolvedValue('hashed-password' as never);
  });

  describe('getAll', () => {
    it('全スーパー管理者を返す', async () => {
      const mockAdmins = [{ id: '1', email: 'admin@example.com' }];
      mockedRepo.findAll.mockResolvedValue(mockAdmins as never);

      const result = await superAdminService.getAll();

      expect(mockedRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockAdmins);
    });
  });

  describe('create', () => {
    it('新しいスーパー管理者を作成する', async () => {
      mockedRepo.findByEmail.mockResolvedValue(null as never);
      mockedRepo.create.mockResolvedValue({ id: '1', email: 'new@example.com' } as never);

      const result = await superAdminService.create({
        email: 'new@example.com',
        password: 'password123',
        name: 'テスト管理者',
      });

      expect(mockedHash).toHaveBeenCalledWith('password123', 12);
      expect(mockedRepo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'hashed-password',
        name: 'テスト管理者',
      });
      expect(result).toEqual({ id: '1', email: 'new@example.com' });
    });

    it('名前が未指定の場合nullが設定される', async () => {
      mockedRepo.findByEmail.mockResolvedValue(null as never);
      mockedRepo.create.mockResolvedValue({ id: '1' } as never);

      await superAdminService.create({
        email: 'test@example.com',
        password: 'pass',
      });

      expect(mockedRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: null,
      }));
    });

    it('メールアドレスが重複している場合エラーをスローする', async () => {
      mockedRepo.findByEmail.mockResolvedValue({ id: '1' } as never);

      await expect(
        superAdminService.create({ email: 'existing@example.com', password: 'pass' }),
      ).rejects.toThrow('DUPLICATE_EMAIL');
    });
  });

  describe('update', () => {
    it('存在するアカウントを更新する', async () => {
      mockedRepo.findById.mockResolvedValue({ id: '1', email: 'admin@example.com' } as never);
      mockedRepo.update.mockResolvedValue({ id: '1', name: '新名前' } as never);

      const result = await superAdminService.update('1', { name: '新名前' });

      expect(mockedRepo.update).toHaveBeenCalledWith('1', { name: '新名前' });
      expect(result).toEqual({ id: '1', name: '新名前' });
    });

    it('パスワードが指定された場合ハッシュ化して更新する', async () => {
      mockedRepo.findById.mockResolvedValue({ id: '1' } as never);
      mockedRepo.update.mockResolvedValue({ id: '1' } as never);

      await superAdminService.update('1', { password: 'newpass' });

      expect(mockedHash).toHaveBeenCalledWith('newpass', 12);
      expect(mockedRepo.update).toHaveBeenCalledWith('1', { password: 'hashed-password' });
    });

    it('存在しないアカウントの場合エラーをスローする', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      await expect(
        superAdminService.update('999', { name: 'テスト' }),
      ).rejects.toThrow('ACCOUNT_NOT_FOUND');
    });

    it('更新データがない場合エラーをスローする', async () => {
      mockedRepo.findById.mockResolvedValue({ id: '1' } as never);

      await expect(
        superAdminService.update('1', {}),
      ).rejects.toThrow('NO_UPDATE_DATA');
    });

    it('nameが空文字の場合nullに変換される', async () => {
      mockedRepo.findById.mockResolvedValue({ id: '1' } as never);
      mockedRepo.update.mockResolvedValue({ id: '1' } as never);

      await superAdminService.update('1', { name: '' });

      expect(mockedRepo.update).toHaveBeenCalledWith('1', { name: null });
    });
  });

  describe('delete', () => {
    it('他のアカウントを削除する', async () => {
      mockedRepo.findById.mockResolvedValue({ id: '2' } as never);
      mockedRepo.delete.mockResolvedValue(undefined as never);

      await superAdminService.delete('2', '1');

      expect(mockedRepo.delete).toHaveBeenCalledWith('2');
    });

    it('自分自身を削除しようとするとエラーをスローする', async () => {
      await expect(
        superAdminService.delete('1', '1'),
      ).rejects.toThrow('CANNOT_DELETE_SELF');
    });

    it('存在しないアカウントを削除しようとするとエラーをスローする', async () => {
      mockedRepo.findById.mockResolvedValue(null as never);

      await expect(
        superAdminService.delete('999', '1'),
      ).rejects.toThrow('ACCOUNT_NOT_FOUND');
    });
  });

  describe('getAuditLogs', () => {
    it('ページネーション付きで監査ログを返す', async () => {
      const mockLogs = [{ id: 1, action: 'LOGIN' }];
      mockedRepo.findAllAuditLogs.mockResolvedValue(mockLogs as never);
      mockedRepo.countAuditLogs.mockResolvedValue(50);

      const result = await superAdminService.getAuditLogs({
        page: 2,
        limit: 10,
        tenantId: 1,
        action: 'LOGIN',
      });

      expect(mockedRepo.findAllAuditLogs).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        tenantId: 1,
        action: 'LOGIN',
        startDate: undefined,
        endDate: undefined,
      });
      expect(result.data).toEqual(mockLogs);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(5);
      expect(result.page).toBe(2);
    });
  });
});
