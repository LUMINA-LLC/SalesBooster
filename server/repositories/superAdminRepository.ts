import { prisma } from '@/lib/prisma';

export const superAdminRepository = {
  findAll() {
    return prisma.user.findMany({
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
  },

  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, role: 'SUPER_ADMIN', tenantId: null },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, role: 'SUPER_ADMIN', tenantId: null },
    });
  },

  create(data: { email: string; password: string; name: string | null }) {
    return prisma.user.create({
      data: { ...data, role: 'SUPER_ADMIN', tenantId: null },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  findAllAuditLogs(options: {
    skip?: number;
    take?: number;
    tenantId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Record<string, unknown> = {};
    if (options.tenantId) where.tenantId = options.tenantId;
    if (options.action) where.action = options.action;
    if (options.startDate || options.endDate) {
      const createdAt: Record<string, Date> = {};
      if (options.startDate) createdAt.gte = options.startDate;
      if (options.endDate) createdAt.lte = options.endDate;
      where.createdAt = createdAt;
    }

    return prisma.auditLog.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        tenant: { select: { name: true } },
      },
    });
  },

  countAuditLogs(options: {
    tenantId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Record<string, unknown> = {};
    if (options.tenantId) where.tenantId = options.tenantId;
    if (options.action) where.action = options.action;
    if (options.startDate || options.endDate) {
      const createdAt: Record<string, Date> = {};
      if (options.startDate) createdAt.gte = options.startDate;
      if (options.endDate) createdAt.lte = options.endDate;
      where.createdAt = createdAt;
    }

    return prisma.auditLog.count({ where });
  },
};
