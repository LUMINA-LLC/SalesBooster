import { prisma } from '@/lib/prisma';

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

  create(data: { name: string; slug: string }) {
    return prisma.tenant.create({ data });
  },

  update(id: number, data: { name?: string; slug?: string; isActive?: boolean }) {
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

  updateAdmin(adminId: string, data: { name?: string; email?: string; password?: string }) {
    return prisma.user.update({
      where: { id: adminId },
      data,
      select: { id: true, name: true, email: true },
    });
  },
};
