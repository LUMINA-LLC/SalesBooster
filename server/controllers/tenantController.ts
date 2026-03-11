import { NextRequest } from 'next/server';
import { tenantService } from '../services/tenantService';
import { tenantRepository } from '../repositories/tenantRepository';
import { auditLogService } from '../services/auditLogService';
import { requireSuperAdmin, getTenantId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const tenantController = {
  async getAll(request: NextRequest) {
    try {
      await requireSuperAdmin(request);
      const tenants = await tenantService.getAll();
      return ApiResponse.success(tenants);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch tenants');
    }
  },

  async getById(request: NextRequest, id: number) {
    try {
      await requireSuperAdmin(request);
      const tenant = await tenantService.getById(id);
      if (!tenant) {
        return ApiResponse.notFound('テナントが見つかりません');
      }
      return ApiResponse.success(tenant);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch tenant');
    }
  },

  async getByIdWithDetails(request: NextRequest, id: number) {
    try {
      await requireSuperAdmin(request);
      const tenant = await tenantService.getByIdWithDetails(id);
      if (!tenant) {
        return ApiResponse.notFound('テナントが見つかりません');
      }
      return ApiResponse.success(tenant);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch tenant details');
    }
  },

  async create(request: NextRequest) {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { name, slug, adminEmail, adminPassword, adminName } = body;

      if (!name || !slug || !adminEmail || !adminPassword) {
        return ApiResponse.badRequest('name, slug, adminEmail, adminPassword are required');
      }

      if (!/^[a-z0-9-]+$/.test(slug)) {
        return ApiResponse.badRequest('slugは英小文字・数字・ハイフンのみ使用可能です');
      }

      if (adminPassword.length < 8) {
        return ApiResponse.badRequest('パスワードは8文字以上で設定してください');
      }

      const tenant = await tenantService.create({ name, slug, adminEmail, adminPassword, adminName });

      auditLogService.createWithTenantId(
        request, tenant.id, 'TENANT_CREATE',
        `テナント「${name}」(${slug})を作成`,
      ).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(tenant);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_SLUG') {
        return ApiResponse.conflict('このslugは既に使用されています');
      }
      return ApiResponse.fromError(error, 'Failed to create tenant');
    }
  },

  async update(request: NextRequest, id: number) {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { name, slug, isActive } = body;

      if (slug && !/^[a-z0-9-]+$/.test(slug)) {
        return ApiResponse.badRequest('slugは英小文字・数字・ハイフンのみ使用可能です');
      }

      const tenant = await tenantService.update(id, { name, slug, isActive });

      auditLogService.createWithTenantId(
        request, id, 'TENANT_UPDATE',
        `テナントID:${id}を更新`,
      ).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(tenant);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_SLUG') {
        return ApiResponse.conflict('このslugは既に使用されています');
      }
      return ApiResponse.fromError(error, 'Failed to update tenant');
    }
  },

  async updateLicense(request: NextRequest, id: number) {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { planType, maxMembers, licenseStartDate, licenseEndDate, isTrial } = body;

      const tenant = await tenantService.updateLicense(id, {
        planType,
        maxMembers: maxMembers !== undefined ? (maxMembers === null || maxMembers === '' ? null : Number(maxMembers)) : undefined,
        licenseStartDate,
        licenseEndDate,
        isTrial,
      });

      auditLogService.createWithTenantId(
        request, id, 'SUBSCRIPTION_UPDATE',
        `テナントID:${id}のライセンス情報を更新`,
      ).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(tenant);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update license');
    }
  },

  async getLicenseStatus(request: NextRequest, tenantId: number) {
    try {
      const status = await tenantService.getLicenseStatus(tenantId);
      if (!status) {
        return ApiResponse.notFound('テナントが見つかりません');
      }
      return ApiResponse.success(status);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch license status');
    }
  },

  async updateAdmin(request: NextRequest, tenantId: number, adminId: string) {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { name, email, password } = body;

      if (password && password.length < 8) {
        return ApiResponse.badRequest('パスワードは8文字以上で設定してください');
      }

      const updated = await tenantService.updateAdmin(tenantId, adminId, { name, email, password });

      auditLogService.createWithTenantId(
        request, tenantId, 'TENANT_UPDATE',
        `テナントID:${tenantId}の管理者(${adminId})を更新`,
      ).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(updated);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ADMIN_NOT_FOUND') {
          return ApiResponse.notFound('管理者が見つかりません');
        }
        if (error.message === 'DUPLICATE_EMAIL') {
          return ApiResponse.conflict('このメールアドレスは既に使用されています');
        }
      }
      return ApiResponse.fromError(error, 'Failed to update admin');
    }
  },

  async getSubscriptionHistories(request: NextRequest) {
    try {
      await requireSuperAdmin(request);
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get('page')) || 1;
      const limit = Number(searchParams.get('limit')) || 50;
      const tenantIdParam = searchParams.get('tenantId');
      const tenantId = tenantIdParam ? Number(tenantIdParam) : undefined;

      const [data, total] = await Promise.all([
        tenantRepository.findAllSubscriptionHistories(page, limit, tenantId),
        tenantRepository.countAllSubscriptionHistories(tenantId),
      ]);

      return ApiResponse.success({
        data,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch subscription histories');
    }
  },

  async getMySubscriptionHistories(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const data = await tenantRepository.findSubscriptionHistories(tenantId, 1, 20);
      return ApiResponse.success(data);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch subscription histories');
    }
  },
};
