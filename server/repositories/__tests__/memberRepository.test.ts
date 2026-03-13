import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { memberRepository } from '../memberRepository';

describe('memberRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDでSUPER_ADMIN以外のユーザーを取得する', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User1',
          email: 'user1@test.com',
          tenantId,
          role: 'USER',
          department: { name: '営業部' },
        },
      ];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await memberRepository.findAll(tenantId);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { tenantId, role: { not: 'SUPER_ADMIN' } },
        include: { department: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findByIds', () => {
    it('指定IDリストでユーザーを取得する', async () => {
      const ids = ['1', '2'];
      const mockUsers = [{ id: '1' }, { id: '2' }];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await memberRepository.findByIds(ids, tenantId);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ids }, tenantId },
        include: { department: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findById', () => {
    it('IDとテナントIDでユーザーを取得する', async () => {
      const mockUser = { id: '1', name: 'User1', tenantId };
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await memberRepository.findById('1', tenantId);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: '1', tenantId },
        include: { department: true },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmails', () => {
    it('メールアドレスリストでユーザーを取得する', async () => {
      const emails = ['a@test.com', 'b@test.com'];
      const mockUsers = [{ email: 'a@test.com' }];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await memberRepository.findByEmails(emails, tenantId);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { email: { in: emails }, tenantId },
        select: { email: true },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('create', () => {
    it('パスワードをハッシュ化してユーザーを作成する', async () => {
      const data = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      };
      const mockCreated = { id: '1', ...data, tenantId };
      prismaMock.user.create.mockResolvedValue(mockCreated);

      const result = await memberRepository.create(tenantId, data);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New User',
          email: 'new@test.com',
          password: expect.any(String),
          role: 'USER',
          tenantId,
        }),
      });
      // パスワードがハッシュ化されていることを確認
      const calledData = prismaMock.user.create.mock.calls[0][0].data;
      expect(calledData.password).not.toBe('password123');
      expect(result).toEqual(mockCreated);
    });

    it('指定されたロールでユーザーを作成する', async () => {
      const data = {
        name: 'Admin',
        email: 'admin@test.com',
        password: 'pass',
        role: 'ADMIN' as const,
      };
      prismaMock.user.create.mockResolvedValue({ id: '2', ...data, tenantId });

      await memberRepository.create(tenantId, data);

      const calledData = prismaMock.user.create.mock.calls[0][0].data;
      expect(calledData.role).toBe('ADMIN');
    });
  });

  describe('update', () => {
    it('ユーザー情報を更新する', async () => {
      const data = { name: 'Updated' };
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await memberRepository.update('1', tenantId, data);

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: '1', tenantId },
        data,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('delete', () => {
    it('ユーザーを削除する', async () => {
      prismaMock.user.deleteMany.mockResolvedValue({ count: 1 });

      const result = await memberRepository.delete('1', tenantId);

      expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
        where: { id: '1', tenantId },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
