import { hash } from 'bcryptjs';
import { tenantRepository } from '../repositories/tenantRepository';
import { prisma } from '@/lib/prisma';

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

  async create(data: { name: string; slug: string; adminEmail: string; adminPassword: string; adminName?: string }) {
    // slug重複チェック
    const existing = await tenantRepository.findBySlug(data.slug);
    if (existing) {
      throw new Error('DUPLICATE_SLUG');
    }

    // トランザクションでテナント + 初期管理者 + デフォルトIntegration作成
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: data.name, slug: data.slug },
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

      // デフォルトのIntegration（LINE Messaging API）を作成
      await tx.integration.create({
        data: {
          name: 'LINE Messaging API',
          description: 'LINEメッセージング連携',
          icon: 'line',
          tenantId: tenant.id,
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
