import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { superAdminRepository } from '../superAdminRepository';

describe('superAdminRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('全スーパー管理者を取得する', async () => {
      const mockAdmins = [
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ];
      prismaMock.user.findMany.mockResolvedValue(mockAdmins);

      const result = await superAdminRepository.findAll();

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { role: 'SUPER_ADMIN', tenantId: null },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAdmins);
    });
  });

  describe('findById', () => {
    it('IDでスーパー管理者を取得する', async () => {
      const mockAdmin = {
        id: '1',
        email: 'admin@test.com',
        role: 'SUPER_ADMIN',
      };
      prismaMock.user.findFirst.mockResolvedValue(mockAdmin);

      const result = await superAdminRepository.findById('1');

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: '1', role: 'SUPER_ADMIN', tenantId: null },
      });
      expect(result).toEqual(mockAdmin);
    });
  });

  describe('findByEmail', () => {
    it('メールアドレスでスーパー管理者を取得する', async () => {
      const mockAdmin = { id: '1', email: 'admin@test.com' };
      prismaMock.user.findFirst.mockResolvedValue(mockAdmin);

      const result = await superAdminRepository.findByEmail('admin@test.com');

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'admin@test.com', role: 'SUPER_ADMIN', tenantId: null },
      });
      expect(result).toEqual(mockAdmin);
    });
  });

  describe('create', () => {
    it('スーパー管理者を作成する', async () => {
      const data = {
        email: 'new@test.com',
        password: 'hashed',
        name: 'New Admin',
      };
      const mockCreated = {
        id: '1',
        email: 'new@test.com',
        name: 'New Admin',
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValue(mockCreated);

      const result = await superAdminRepository.create(data);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { ...data, role: 'SUPER_ADMIN', tenantId: null },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('スーパー管理者を更新する', async () => {
      const data = { name: 'Updated Admin' };
      const mockUpdated = {
        id: '1',
        email: 'admin@test.com',
        name: 'Updated Admin',
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      prismaMock.user.update.mockResolvedValue(mockUpdated);

      const result = await superAdminRepository.update('1', data);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('スーパー管理者を削除する', async () => {
      const mockDeleted = { id: '1' };
      prismaMock.user.delete.mockResolvedValue(mockDeleted);

      const result = await superAdminRepository.delete('1');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('findAllAuditLogs', () => {
    it('全監査ログを取得する', async () => {
      const mockLogs = [{ id: 1, action: 'LOGIN' }];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await superAdminRepository.findAllAuditLogs({
        skip: 0,
        take: 10,
      });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          tenant: { select: { name: true } },
        },
      });
      expect(result).toEqual(mockLogs);
    });

    it('フィルタ付きで監査ログを取得する', async () => {
      const startDate = new Date('2025-01-01');
      prismaMock.auditLog.findMany.mockResolvedValue([]);

      await superAdminRepository.findAllAuditLogs({
        tenantId: 1,
        action: 'LOGIN',
        startDate,
      });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          action: 'LOGIN',
          createdAt: { gte: startDate },
        },
        skip: undefined,
        take: undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          tenant: { select: { name: true } },
        },
      });
    });
  });

  describe('countAuditLogs', () => {
    it('監査ログ数をカウントする', async () => {
      prismaMock.auditLog.count.mockResolvedValue(25);

      const result = await superAdminRepository.countAuditLogs({});

      expect(prismaMock.auditLog.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(25);
    });
  });
});
