import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

export const auditLogRepository = {
  findAll(
    tenantId: number,
    options?: {
      skip?: number;
      take?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where = this._buildWhere(
      tenantId,
      options?.startDate,
      options?.endDate,
    );
    return prisma.auditLog.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  },

  count(tenantId: number, options?: { startDate?: Date; endDate?: Date }) {
    const where = this._buildWhere(
      tenantId,
      options?.startDate,
      options?.endDate,
    );
    return prisma.auditLog.count({ where });
  },

  _buildWhere(tenantId: number, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { tenantId };
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }
    return where;
  },

  create(data: {
    userId: string;
    action: AuditAction;
    tenantId: number;
    detail?: string;
  }) {
    return prisma.auditLog.create({ data });
  },
};
