import { hash } from 'bcryptjs';
import { PlanType } from '@prisma/client';
import { tenantRepository } from '../repositories/tenantRepository';
import { prisma } from '@/lib/prisma';

const TRIAL_DAYS = 30;

export interface LicenseUpdateData {
  planType?: PlanType | null;
  maxMembers?: number | null;
  licenseStartDate?: string | null;
  licenseEndDate?: string | null;
  isTrial?: boolean;
}

export interface LicenseStatus {
  planType: PlanType | null;
  maxMembers: number | null;
  currentMembers: number;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number | null; // null = 無期限
}

export const tenantService = {
  async getAll() {
    return tenantRepository.findAll();
  },

  async getById(id: number) {
    return tenantRepository.findById(id);
  },

  async getByIdWithDetails(id: number) {
    return tenantRepository.findByIdWithDetails(id);
  },

  async getPublicBySlug(slug: string) {
    if (!slug || !/^[a-z0-9]+$/.test(slug) || slug.length < 5) {
      return null;
    }
    const tenant = await tenantRepository.findActiveBySlug(slug);
    if (!tenant) return null;
    return { name: tenant.name };
  },

  async create(data: {
    name: string; slug: string; adminEmail: string; adminPassword: string; adminName?: string;
    planType?: string; maxMembers?: number | null; licenseStartDate?: string | null; licenseEndDate?: string | null; isTrial?: boolean;
  }) {
    const existing = await tenantRepository.findBySlug(data.slug);
    if (existing) {
      throw new Error('DUPLICATE_SLUG');
    }

    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          planType: (data.planType as PlanType) || 'TRIAL',
          isTrial: data.isTrial ?? true,
          maxMembers: data.maxMembers ?? null,
          licenseStartDate: data.licenseStartDate ? new Date(data.licenseStartDate) : now,
          licenseEndDate: data.licenseEndDate ? new Date(data.licenseEndDate) : trialEnd,
        },
      });

      const hashedPassword = await hash(data.adminPassword, 12);
      await tx.user.create({
        data: {
          email: data.adminEmail,
          password: hashedPassword,
          name: data.adminName || data.name + ' 管理者',
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          tenantId: tenant.id,
          action: 'TRIAL_START',
          planType: 'TRIAL',
          startDate: now,
          endDate: trialEnd,
          note: `${TRIAL_DAYS}日間トライアル開始`,
        },
      });

      return tenant;
    });
  },

  async update(id: number, data: { name?: string; slug?: string; isActive?: boolean }) {
    if (data.slug) {
      const existing = await tenantRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new Error('DUPLICATE_SLUG');
      }
    }
    return tenantRepository.update(id, data);
  },

  async updateLicense(id: number, data: LicenseUpdateData) {
    if (!data.planType) {
      throw new Error('PLAN_TYPE_REQUIRED');
    }
    if (!data.licenseEndDate) {
      throw new Error('LICENSE_END_DATE_REQUIRED');
    }

    const updateData: Record<string, unknown> = {};

    if (data.planType !== undefined) updateData.planType = data.planType;
    if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers;
    if (data.isTrial !== undefined) updateData.isTrial = data.isTrial;
    if (data.licenseStartDate !== undefined) {
      updateData.licenseStartDate = data.licenseStartDate ? new Date(data.licenseStartDate) : null;
    }
    if (data.licenseEndDate !== undefined) {
      updateData.licenseEndDate = data.licenseEndDate ? new Date(data.licenseEndDate) : null;
    }

    const tenant = await tenantRepository.update(id, updateData);

    await tenantRepository.createSubscriptionHistory({
      tenantId: id,
      action: 'UPDATE',
      planType: data.planType,
      maxMembers: data.maxMembers,
      startDate: data.licenseStartDate ? new Date(data.licenseStartDate) : null,
      endDate: data.licenseEndDate ? new Date(data.licenseEndDate) : null,
    });

    return tenant;
  },

  async getLicenseStatus(tenantId: number): Promise<LicenseStatus | null> {
    const info = await tenantRepository.findLicenseInfo(tenantId);
    if (!info) return null;

    const now = new Date();
    const endDate = info.licenseEndDate;
    let isExpired = false;
    let daysRemaining: number | null = null;

    if (!info.planType || !endDate) {
      // ライセンス未設定は期限切れ扱い
      isExpired = true;
      daysRemaining = 0;
    } else {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      isExpired = now > end;
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      planType: info.planType,
      maxMembers: info.maxMembers,
      currentMembers: info._count.users,
      licenseStartDate: info.licenseStartDate?.toISOString() ?? null,
      licenseEndDate: info.licenseEndDate?.toISOString() ?? null,
      isTrial: info.isTrial,
      isExpired,
      daysRemaining,
    };
  },

  async checkMemberLimit(tenantId: number, additionalCount: number = 1): Promise<{ allowed: boolean; currentCount: number; maxMembers: number | null }> {
    const info = await tenantRepository.findLicenseInfo(tenantId);
    if (!info || info.maxMembers === null) {
      return { allowed: true, currentCount: info?._count.users ?? 0, maxMembers: null };
    }
    const currentCount = info._count.users;
    return {
      allowed: currentCount + additionalCount <= info.maxMembers,
      currentCount,
      maxMembers: info.maxMembers,
    };
  },

  async isLicenseExpired(tenantId: number): Promise<boolean> {
    const info = await tenantRepository.findLicenseInfo(tenantId);
    if (!info || !info.planType || !info.licenseEndDate) return true;
    const end = new Date(info.licenseEndDate);
    end.setHours(23, 59, 59, 999);
    return new Date() > end;
  },

  async deactivate(id: number) {
    return tenantRepository.update(id, { isActive: false });
  },

  async updateAdmin(
    tenantId: number,
    adminId: string,
    data: { name?: string; email?: string; password?: string }
  ) {
    const admin = await tenantRepository.findAdminByIdAndTenant(adminId, tenantId);
    if (!admin) {
      throw new Error('ADMIN_NOT_FOUND');
    }

    if (data.email && data.email !== admin.email) {
      const existing = await tenantRepository.findUserByEmailAndTenant(data.email, tenantId);
      if (existing) {
        throw new Error('DUPLICATE_EMAIL');
      }
    }

    const updateData: { name?: string; email?: string; password?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = await hash(data.password, 12);

    return tenantRepository.updateAdmin(adminId, updateData);
  },
};
