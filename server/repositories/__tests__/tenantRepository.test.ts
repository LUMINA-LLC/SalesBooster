import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { tenantRepository } from '../tenantRepository';

describe('tenantRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('全テナントを取得する', async () => {
      const mockTenants = [{ id: 1, name: 'Tenant1', _count: { users: 5 } }];
      prismaMock.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await tenantRepository.findAll();

      expect(prismaMock.tenant.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { users: true } } },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual(mockTenants);
    });
  });

  describe('findById', () => {
    it('IDでテナントを取得する', async () => {
      const mockTenant = { id: 1, name: 'Tenant1', _count: { users: 5 } };
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await tenantRepository.findById(1);

      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { _count: { select: { users: true } } },
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('findByIdWithDetails', () => {
    it('IDで詳細付きテナントを取得する', async () => {
      const mockTenant = { id: 1, name: 'Tenant1', users: [], subscriptionHistories: [] };
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await tenantRepository.findByIdWithDetails(1);

      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          _count: {
            select: {
              users: true,
              departments: true,
              groups: true,
              salesRecords: true,
              targets: true,
              integrations: true,
            },
          },
          users: {
            where: { role: 'ADMIN' },
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
          subscriptionHistories: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('findBySlug', () => {
    it('スラグでテナントを取得する', async () => {
      const mockTenant = { id: 1, slug: 'test-tenant' };
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await tenantRepository.findBySlug('test-tenant');

      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('findActiveBySlug', () => {
    it('アクティブなテナントをスラグで取得する', async () => {
      const mockTenant = { id: 1, name: 'Tenant1' };
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await tenantRepository.findActiveBySlug('test-tenant');

      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant', isActive: true },
        select: { id: true, name: true },
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('findLicenseInfo', () => {
    it('テナントのライセンス情報を取得する', async () => {
      const mockInfo = { id: 1, planType: 'STANDARD', maxMembers: 10, _count: { users: 3 } };
      prismaMock.tenant.findUnique.mockResolvedValue(mockInfo);

      const result = await tenantRepository.findLicenseInfo(1);

      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          planType: true,
          maxMembers: true,
          licenseStartDate: true,
          licenseEndDate: true,
          isTrial: true,
          _count: { select: { users: true } },
        },
      });
      expect(result).toEqual(mockInfo);
    });
  });

  describe('create', () => {
    it('テナントを作成する', async () => {
      const data = { name: 'New Tenant', slug: 'new-tenant' };
      const mockCreated = { id: 1, ...data };
      prismaMock.tenant.create.mockResolvedValue(mockCreated);

      const result = await tenantRepository.create(data);

      expect(prismaMock.tenant.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('テナントを更新する', async () => {
      const data = { name: 'Updated Tenant' };
      const mockUpdated = { id: 1, ...data };
      prismaMock.tenant.update.mockResolvedValue(mockUpdated);

      const result = await tenantRepository.update(1, data);

      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data,
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('テナントを削除する', async () => {
      const mockDeleted = { id: 1 };
      prismaMock.tenant.delete.mockResolvedValue(mockDeleted);

      const result = await tenantRepository.delete(1);

      expect(prismaMock.tenant.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('findAdminByIdAndTenant', () => {
    it('管理者IDとテナントIDで管理者を取得する', async () => {
      const mockAdmin = { id: 'admin1', role: 'ADMIN', tenantId: 1 };
      prismaMock.user.findFirst.mockResolvedValue(mockAdmin);

      const result = await tenantRepository.findAdminByIdAndTenant('admin1', 1);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'admin1', tenantId: 1, role: 'ADMIN' },
      });
      expect(result).toEqual(mockAdmin);
    });
  });

  describe('findUserByEmailAndTenant', () => {
    it('メールアドレスとテナントIDでユーザーを取得する', async () => {
      const mockUser = { id: 'user1', email: 'user@test.com', tenantId: 1 };
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await tenantRepository.findUserByEmailAndTenant('user@test.com', 1);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'user@test.com', tenantId: 1 },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateAdmin', () => {
    it('管理者情報を更新する', async () => {
      const data = { name: 'Updated Admin' };
      const mockUpdated = { id: 'admin1', name: 'Updated Admin', email: 'admin@test.com' };
      prismaMock.user.update.mockResolvedValue(mockUpdated);

      const result = await tenantRepository.updateAdmin('admin1', data);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'admin1' },
        data,
        select: { id: true, name: true, email: true },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('createSubscriptionHistory', () => {
    it('サブスクリプション履歴を作成する', async () => {
      const data = { tenantId: 1, action: 'ACTIVATE', planType: 'STANDARD' as const };
      const mockCreated = { id: 1, ...data };
      prismaMock.subscriptionHistory.create.mockResolvedValue(mockCreated);

      const result = await tenantRepository.createSubscriptionHistory(data);

      expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('findSubscriptionHistories', () => {
    it('テナントIDでサブスクリプション履歴を取得する', async () => {
      const mockHistories = [{ id: 1, tenantId: 1, action: 'ACTIVATE' }];
      prismaMock.subscriptionHistory.findMany.mockResolvedValue(mockHistories);

      const result = await tenantRepository.findSubscriptionHistories(1);

      expect(prismaMock.subscriptionHistory.findMany).toHaveBeenCalledWith({
        where: { tenantId: 1 },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
        include: { tenant: { select: { name: true } } },
      });
      expect(result).toEqual(mockHistories);
    });

    it('ページネーション付きで取得する', async () => {
      prismaMock.subscriptionHistory.findMany.mockResolvedValue([]);

      await tenantRepository.findSubscriptionHistories(1, 2, 10);

      expect(prismaMock.subscriptionHistory.findMany).toHaveBeenCalledWith({
        where: { tenantId: 1 },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
        include: { tenant: { select: { name: true } } },
      });
    });
  });

  describe('countSubscriptionHistories', () => {
    it('テナントIDでサブスクリプション履歴数をカウントする', async () => {
      prismaMock.subscriptionHistory.count.mockResolvedValue(5);

      const result = await tenantRepository.countSubscriptionHistories(1);

      expect(prismaMock.subscriptionHistory.count).toHaveBeenCalledWith({
        where: { tenantId: 1 },
      });
      expect(result).toBe(5);
    });
  });

  describe('findAllSubscriptionHistories', () => {
    it('全サブスクリプション履歴を取得する', async () => {
      prismaMock.subscriptionHistory.findMany.mockResolvedValue([]);

      await tenantRepository.findAllSubscriptionHistories();

      expect(prismaMock.subscriptionHistory.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
        include: { tenant: { select: { name: true } } },
      });
    });

    it('テナントIDフィルタ付きで取得する', async () => {
      prismaMock.subscriptionHistory.findMany.mockResolvedValue([]);

      await tenantRepository.findAllSubscriptionHistories(1, 10, 1);

      expect(prismaMock.subscriptionHistory.findMany).toHaveBeenCalledWith({
        where: { tenantId: 1 },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: { tenant: { select: { name: true } } },
      });
    });
  });

  describe('countAllSubscriptionHistories', () => {
    it('全サブスクリプション履歴数をカウントする', async () => {
      prismaMock.subscriptionHistory.count.mockResolvedValue(20);

      const result = await tenantRepository.countAllSubscriptionHistories();

      expect(prismaMock.subscriptionHistory.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(20);
    });
  });

  describe('countActiveMembers', () => {
    it('アクティブなメンバー数をカウントする', async () => {
      prismaMock.user.count.mockResolvedValue(8);

      const result = await tenantRepository.countActiveMembers(1);

      expect(prismaMock.user.count).toHaveBeenCalledWith({
        where: { tenantId: 1, status: 'ACTIVE' },
      });
      expect(result).toBe(8);
    });
  });

  describe('findSetupStatus', () => {
    it('テナントのセットアップ状況を取得する', async () => {
      const mockStatus = { setupCompleted: true };
      prismaMock.tenant.findUnique.mockResolvedValue(mockStatus);

      const result = await tenantRepository.findSetupStatus(1);

      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { setupCompleted: true },
      });
      expect(result).toEqual(mockStatus);
    });
  });

  describe('updateSetupCompleted', () => {
    it('セットアップ完了状態を更新する', async () => {
      const mockUpdated = { id: 1, setupCompleted: true };
      prismaMock.tenant.update.mockResolvedValue(mockUpdated);

      const result = await tenantRepository.updateSetupCompleted(1, true);

      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { setupCompleted: true },
      });
      expect(result).toEqual(mockUpdated);
    });
  });
});
