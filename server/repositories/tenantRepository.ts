import { PlanType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface TenantUpdateData {
  name?: string;
  slug?: string;
  isActive?: boolean;
  planType?: PlanType | null;
  maxMembers?: number | null;
  licenseStartDate?: Date | null;
  licenseEndDate?: Date | null;
  isTrial?: boolean;
}

export const tenantRepository = {
  findAll() {
    return prisma.tenant.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { id: 'asc' },
    });
  },

  findById(id: number) {
    return prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
  },

  findByIdWithDetails(id: number) {
    return prisma.tenant.findUnique({
      where: { id },
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
  },

  findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  findActiveBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: { id: true, name: true },
    });
  },

  findLicenseInfo(id: number) {
    return prisma.tenant.findUnique({
      where: { id },
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
  },

  create(data: { name: string; slug: string }) {
    return prisma.tenant.create({ data });
  },

  update(id: number, data: TenantUpdateData) {
    return prisma.tenant.update({ where: { id }, data });
  },

  delete(id: number) {
    return prisma.tenant.delete({ where: { id } });
  },

  findAdminByIdAndTenant(adminId: string, tenantId: number) {
    return prisma.user.findFirst({
      where: { id: adminId, tenantId, role: 'ADMIN' },
    });
  },

  findUserByEmailAndTenant(email: string, tenantId: number) {
    return prisma.user.findFirst({
      where: { email, tenantId },
    });
  },

  updateAdmin(
    adminId: string,
    data: { name?: string; email?: string; password?: string },
  ) {
    return prisma.user.update({
      where: { id: adminId },
      data,
      select: { id: true, name: true, email: true },
    });
  },

  createSubscriptionHistory(data: {
    tenantId: number;
    action: string;
    planType?: PlanType | null;
    maxMembers?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    note?: string | null;
  }) {
    return prisma.subscriptionHistory.create({ data });
  },

  findSubscriptionHistories(
    tenantId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    return prisma.subscriptionHistory.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tenant: { select: { name: true } },
      },
    });
  },

  countSubscriptionHistories(tenantId: number) {
    return prisma.subscriptionHistory.count({ where: { tenantId } });
  },

  findAllSubscriptionHistories(
    page: number = 1,
    limit: number = 50,
    tenantId?: number,
  ) {
    const where = tenantId ? { tenantId } : {};
    return prisma.subscriptionHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tenant: { select: { name: true } },
      },
    });
  },

  countAllSubscriptionHistories(tenantId?: number) {
    const where = tenantId ? { tenantId } : {};
    return prisma.subscriptionHistory.count({ where });
  },

  countActiveMembers(tenantId: number) {
    return prisma.user.count({
      where: { tenantId, status: 'ACTIVE' },
    });
  },

  findSetupStatus(tenantId: number) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { setupCompleted: true },
    });
  },

  updateSetupCompleted(tenantId: number, completed: boolean) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { setupCompleted: completed },
    });
  },
};
