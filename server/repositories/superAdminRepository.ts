import { prisma } from '@/server/lib/prisma';

/** 分析集計の where 句（期間・テナント絞り込み）を組み立てる */
function buildAnalyticsWhere(options: {
  tenantId?: number;
  startDate: Date;
  endDate: Date;
}) {
  const where: {
    tenantId?: number;
    createdAt: { gte: Date; lte: Date };
  } = {
    createdAt: { gte: options.startDate, lte: options.endDate },
  };
  if (options.tenantId) where.tenantId = options.tenantId;
  return where;
}

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

  // === 分析（SUPER_ADMIN ダッシュボード用） ===

  /** アクション種別ごとの件数（Prisma groupBy） */
  groupByAction(options: {
    tenantId?: number;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.auditLog.groupBy({
      by: ['action'],
      where: buildAnalyticsWhere(options),
      _count: { _all: true },
    });
  },

  /** テナント別の件数（Prisma groupBy） */
  groupByTenant(options: {
    tenantId?: number;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.auditLog.groupBy({
      by: ['tenantId'],
      where: buildAnalyticsWhere(options),
      _count: { _all: true },
    });
  },

  /** テナント名の解決用（id→name） */
  findTenantNames(ids: number[]) {
    return prisma.tenant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  },

  /** ユーザー別の件数（Prisma groupBy。userId が null のものは除外） */
  groupByUser(options: { tenantId?: number; startDate: Date; endDate: Date }) {
    return prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...buildAnalyticsWhere(options), userId: { not: null } },
      _count: { _all: true },
    });
  },

  /** ユーザー名の解決用（id→name/email） */
  findUserNames(ids: string[]) {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    });
  },

  /**
   * ログイン時のIP別件数（Prisma groupBy）。
   * ipAddress はログイン成功（USER_LOGIN）・失敗（USER_LOGIN_FAILED）の両方で
   * 記録されるため、両イベントを対象に集計する。
   */
  groupByLoginIp(options: {
    tenantId?: number;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        ...buildAnalyticsWhere(options),
        action: { in: ['USER_LOGIN', 'USER_LOGIN_FAILED'] },
        ipAddress: { not: null },
      },
      _count: { _all: true },
    });
  },

  /**
   * 日別集計用に createdAt のみを取得（期間内全イベント）。
   * 日付境界は JST でアプリ側に集約するため createdAt の生値を返す。
   */
  findCreatedAtsForDaily(options: {
    tenantId?: number;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.auditLog.findMany({
      where: buildAnalyticsWhere(options),
      select: { createdAt: true },
    });
  },
};
