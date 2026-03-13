import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantService } from '../tenantService';
import { tenantRepository } from '../../repositories/tenantRepository';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

vi.mock('../../repositories/tenantRepository');
vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(tenantRepository);
const mockedHash = vi.mocked(hash);
const mockedPrisma = vi.mocked(prisma);

describe('tenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHash.mockResolvedValue('hashed-password' as never);
  });

  describe('getAll', () => {
    it('全テナントを返す', async () => {
      const mockTenants = [{ id: 1, name: 'テナント1' }];
      mockedRepo.findAll.mockResolvedValue(mockTenants as never);

      const result = await tenantService.getAll();

      expect(mockedRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTenants);
    });
  });

  describe('getById', () => {
    it('IDでテナントを取得する', async () => {
      const mockTenant = { id: 1, name: 'テナント1' };
      mockedRepo.findById.mockResolvedValue(mockTenant as never);

      const result = await tenantService.getById(1);

      expect(mockedRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('getByIdWithDetails', () => {
    it('詳細付きでテナントを取得する', async () => {
      const mockTenant = { id: 1, name: 'テナント1', users: [] };
      mockedRepo.findByIdWithDetails.mockResolvedValue(mockTenant as never);

      const result = await tenantService.getByIdWithDetails(1);

      expect(mockedRepo.findByIdWithDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('getPublicBySlug', () => {
    it('有効なslugでテナント名を返す', async () => {
      mockedRepo.findActiveBySlug.mockResolvedValue({ name: 'テスト企業' } as never);

      const result = await tenantService.getPublicBySlug('abcde');

      expect(mockedRepo.findActiveBySlug).toHaveBeenCalledWith('abcde');
      expect(result).toEqual({ name: 'テスト企業' });
    });

    it('slugが短すぎる場合nullを返す', async () => {
      const result = await tenantService.getPublicBySlug('abc');

      expect(result).toBeNull();
      expect(mockedRepo.findActiveBySlug).not.toHaveBeenCalled();
    });

    it('slugが空の場合nullを返す', async () => {
      const result = await tenantService.getPublicBySlug('');

      expect(result).toBeNull();
    });

    it('slugに無効な文字が含まれる場合nullを返す', async () => {
      const result = await tenantService.getPublicBySlug('ABC-de');

      expect(result).toBeNull();
    });

    it('テナントが見つからない場合nullを返す', async () => {
      mockedRepo.findActiveBySlug.mockResolvedValue(null as never);

      const result = await tenantService.getPublicBySlug('abcde');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('重複slugの場合エラーをスローする', async () => {
      mockedRepo.findBySlug.mockResolvedValue({ id: 1 } as never);

      await expect(
        tenantService.create({
          name: 'テスト',
          slug: 'existing',
          adminEmail: 'admin@example.com',
          adminPassword: 'password',
        }),
      ).rejects.toThrow('DUPLICATE_SLUG');
    });

    it('トランザクション内でテナント・ユーザー・履歴を作成する', async () => {
      mockedRepo.findBySlug.mockResolvedValue(null as never);

      const mockTx = {
        tenant: { create: vi.fn().mockResolvedValue({ id: 1, name: 'テスト' }) },
        user: { create: vi.fn().mockResolvedValue({ id: 'u1' }) },
        subscriptionHistory: { create: vi.fn().mockResolvedValue({ id: 1 }) },
      };
      mockedPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
        return fn(mockTx);
      });

      const result = await tenantService.create({
        name: 'テスト企業',
        slug: 'testco',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
        adminName: '管理者',
      });

      expect(mockTx.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'テスト企業',
          slug: 'testco',
          planType: 'TRIAL',
          isTrial: true,
        }),
      });
      expect(mockTx.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'admin@test.com',
          password: 'hashed-password',
          name: '管理者',
          role: 'ADMIN',
          tenantId: 1,
        }),
      });
      expect(mockTx.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 1,
          action: 'TRIAL_START',
          planType: 'TRIAL',
        }),
      });
      expect(result).toEqual({ id: 1, name: 'テスト' });
    });
  });

  describe('update', () => {
    it('テナントを更新する', async () => {
      mockedRepo.update.mockResolvedValue({ id: 1, name: '更新後' } as never);

      const result = await tenantService.update(1, { name: '更新後' });

      expect(mockedRepo.update).toHaveBeenCalledWith(1, { name: '更新後' });
      expect(result).toEqual({ id: 1, name: '更新後' });
    });

    it('slugを変更する場合重複チェックを行う', async () => {
      mockedRepo.findBySlug.mockResolvedValue({ id: 2 } as never);

      await expect(
        tenantService.update(1, { slug: 'existing' }),
      ).rejects.toThrow('DUPLICATE_SLUG');
    });

    it('同じテナントの場合slug重複エラーにならない', async () => {
      mockedRepo.findBySlug.mockResolvedValue({ id: 1 } as never);
      mockedRepo.update.mockResolvedValue({ id: 1, slug: 'same' } as never);

      const result = await tenantService.update(1, { slug: 'same' });

      expect(result).toBeTruthy();
    });
  });

  describe('updateLicense', () => {
    it('ライセンス情報を更新して履歴を作成する', async () => {
      mockedRepo.update.mockResolvedValue({ id: 1 } as never);
      mockedRepo.createSubscriptionHistory.mockResolvedValue(undefined as never);

      await tenantService.updateLicense(1, {
        planType: 'STANDARD' as never,
        maxMembers: 50,
        licenseStartDate: '2024-01-01',
        licenseEndDate: '2024-12-31',
        isTrial: false,
      });

      expect(mockedRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        planType: 'STANDARD',
        maxMembers: 50,
        isTrial: false,
      }));
      expect(mockedRepo.createSubscriptionHistory).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 1,
        action: 'UPDATE',
        planType: 'STANDARD',
      }));
    });

    it('planTypeがない場合エラーをスローする', async () => {
      await expect(
        tenantService.updateLicense(1, { licenseEndDate: '2024-12-31' }),
      ).rejects.toThrow('PLAN_TYPE_REQUIRED');
    });

    it('licenseEndDateがない場合エラーをスローする', async () => {
      await expect(
        tenantService.updateLicense(1, { planType: 'STANDARD' as never }),
      ).rejects.toThrow('LICENSE_END_DATE_REQUIRED');
    });
  });

  describe('getLicenseStatus', () => {
    it('ライセンス情報を返す', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockedRepo.findLicenseInfo.mockResolvedValue({
        planType: 'STANDARD',
        maxMembers: 50,
        _count: { users: 10 },
        licenseStartDate: new Date('2024-01-01'),
        licenseEndDate: futureDate,
        isTrial: false,
      } as never);

      const result = await tenantService.getLicenseStatus(1);

      expect(result).not.toBeNull();
      expect(result!.planType).toBe('STANDARD');
      expect(result!.currentMembers).toBe(10);
      expect(result!.isExpired).toBe(false);
      expect(result!.daysRemaining).toBeGreaterThan(0);
    });

    it('ライセンス期限切れの場合isExpiredがtrueになる', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue({
        planType: 'STANDARD',
        maxMembers: 50,
        _count: { users: 10 },
        licenseStartDate: new Date('2023-01-01'),
        licenseEndDate: new Date('2023-12-31'),
        isTrial: false,
      } as never);

      const result = await tenantService.getLicenseStatus(1);

      expect(result!.isExpired).toBe(true);
    });

    it('planTypeがnullの場合isExpiredがtrueになる', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue({
        planType: null,
        maxMembers: null,
        _count: { users: 0 },
        licenseStartDate: null,
        licenseEndDate: null,
        isTrial: false,
      } as never);

      const result = await tenantService.getLicenseStatus(1);

      expect(result!.isExpired).toBe(true);
      expect(result!.daysRemaining).toBe(0);
    });

    it('テナントが見つからない場合nullを返す', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue(null as never);

      const result = await tenantService.getLicenseStatus(999);

      expect(result).toBeNull();
    });
  });

  describe('checkMemberLimit', () => {
    it('上限内の場合allowed: trueを返す', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue({
        maxMembers: 50,
        _count: { users: 10 },
      } as never);

      const result = await tenantService.checkMemberLimit(1);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(10);
      expect(result.maxMembers).toBe(50);
    });

    it('上限に達する場合allowed: falseを返す', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue({
        maxMembers: 10,
        _count: { users: 10 },
      } as never);

      const result = await tenantService.checkMemberLimit(1);

      expect(result.allowed).toBe(false);
    });

    it('maxMembersがnullの場合（無制限）allowed: trueを返す', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue({
        maxMembers: null,
        _count: { users: 100 },
      } as never);

      const result = await tenantService.checkMemberLimit(1);

      expect(result.allowed).toBe(true);
      expect(result.maxMembers).toBeNull();
    });
  });

  describe('isLicenseExpired', () => {
    it('期限内の場合falseを返す', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockedRepo.findLicenseInfo.mockResolvedValue({
        planType: 'STANDARD',
        licenseEndDate: futureDate,
      } as never);

      const result = await tenantService.isLicenseExpired(1);

      expect(result).toBe(false);
    });

    it('期限切れの場合trueを返す', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue({
        planType: 'STANDARD',
        licenseEndDate: new Date('2020-01-01'),
      } as never);

      const result = await tenantService.isLicenseExpired(1);

      expect(result).toBe(true);
    });

    it('情報がない場合trueを返す', async () => {
      mockedRepo.findLicenseInfo.mockResolvedValue(null as never);

      const result = await tenantService.isLicenseExpired(1);

      expect(result).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('テナントを無効化する', async () => {
      mockedRepo.update.mockResolvedValue({ id: 1, isActive: false } as never);

      const result = await tenantService.deactivate(1);

      expect(mockedRepo.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(result).toEqual({ id: 1, isActive: false });
    });
  });

  describe('updateAdmin', () => {
    it('管理者情報を更新する', async () => {
      mockedRepo.findAdminByIdAndTenant.mockResolvedValue({
        id: 'a1',
        email: 'old@example.com',
      } as never);
      mockedRepo.updateAdmin.mockResolvedValue({ id: 'a1', name: '新名前' } as never);

      const result = await tenantService.updateAdmin(1, 'a1', { name: '新名前' });

      expect(mockedRepo.updateAdmin).toHaveBeenCalledWith('a1', { name: '新名前' });
      expect(result).toEqual({ id: 'a1', name: '新名前' });
    });

    it('パスワード変更時にハッシュ化される', async () => {
      mockedRepo.findAdminByIdAndTenant.mockResolvedValue({
        id: 'a1',
        email: 'admin@example.com',
      } as never);
      mockedRepo.updateAdmin.mockResolvedValue({ id: 'a1' } as never);

      await tenantService.updateAdmin(1, 'a1', { password: 'newpass' });

      expect(mockedHash).toHaveBeenCalledWith('newpass', 12);
      expect(mockedRepo.updateAdmin).toHaveBeenCalledWith('a1', { password: 'hashed-password' });
    });

    it('メール変更時に重複チェックを行う', async () => {
      mockedRepo.findAdminByIdAndTenant.mockResolvedValue({
        id: 'a1',
        email: 'old@example.com',
      } as never);
      mockedRepo.findUserByEmailAndTenant.mockResolvedValue({ id: 'a2' } as never);

      await expect(
        tenantService.updateAdmin(1, 'a1', { email: 'existing@example.com' }),
      ).rejects.toThrow('DUPLICATE_EMAIL');
    });

    it('管理者が見つからない場合エラーをスローする', async () => {
      mockedRepo.findAdminByIdAndTenant.mockResolvedValue(null as never);

      await expect(
        tenantService.updateAdmin(1, 'unknown', { name: 'テスト' }),
      ).rejects.toThrow('ADMIN_NOT_FOUND');
    });
  });
});
