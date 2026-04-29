import { prisma } from '@/lib/prisma';

interface PaginationFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  userIds?: string[];
  dataTypeId?: number;
}

export const salesRecordRepository = {
  findByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: number,
    userIds?: string[],
    dataTypeId?: number,
  ) {
    return prisma.salesRecord.findMany({
      where: {
        tenantId,
        recordDate: { gte: startDate, lte: endDate },
        ...(userIds ? { userId: { in: userIds } } : {}),
        ...(dataTypeId ? { dataTypeId } : {}),
      },
      include: { user: { include: { department: true } }, dataType: true },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.salesRecord.findFirst({
      where: { id, tenantId },
      include: { user: { include: { department: true } }, dataType: true },
    });
  },

  async findPaginated(
    page: number,
    pageSize: number,
    tenantId: number,
    filters?: PaginationFilters,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.startDate || filters?.endDate) {
      where.recordDate = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    } else if (filters?.userIds !== undefined) {
      where.userId = { in: filters.userIds };
    }
    if (filters?.dataTypeId) {
      where.dataTypeId = filters.dataTypeId;
    }

    const [records, total] = await Promise.all([
      prisma.salesRecord.findMany({
        where,
        include: { user: { include: { department: true } }, dataType: true },
        orderBy: { recordDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salesRecord.count({ where }),
    ]);

    return { records, total };
  },

  async findAll(tenantId: number, filters?: PaginationFilters) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.startDate || filters?.endDate) {
      where.recordDate = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    } else if (filters?.userIds !== undefined) {
      where.userId = { in: filters.userIds };
    }
    if (filters?.dataTypeId) {
      where.dataTypeId = filters.dataTypeId;
    }

    return prisma.salesRecord.findMany({
      where,
      include: { user: { include: { department: true } }, dataType: true },
      orderBy: { recordDate: 'desc' },
    });
  },

  update(
    id: number,
    tenantId: number,
    data: {
      userId?: string;
      value?: number;
      description?: string;
      recordDate?: Date;
      customFields?: Record<string, string>;
      dataTypeId?: number;
    },
  ) {
    return prisma.salesRecord.updateMany({
      where: { id, tenantId },
      data,
    });
  },

  remove(id: number, tenantId: number) {
    return prisma.salesRecord.deleteMany({ where: { id, tenantId } });
  },

  async findMinDate(tenantId: number): Promise<Date | null> {
    const result = await prisma.salesRecord.aggregate({
      where: { tenantId },
      _min: { recordDate: true },
    });
    return result._min.recordDate;
  },

  create(
    tenantId: number,
    data: {
      userId: string;
      value: number;
      description?: string;
      recordDate: Date;
      customFields?: Record<string, string>;
      dataTypeId?: number;
      notifyBreakingNews?: boolean;
    },
  ) {
    return prisma.salesRecord.create({ data: { ...data, tenantId } });
  },

  /** 期間内のレコード総数を取得 */
  /**
   * 速報用: 期間内のレコード件数を返す。
   * notifyBreakingNews=false のレコードは速報対象外のため除外する。
   */
  countByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: number,
    userIds?: string[],
  ) {
    return prisma.salesRecord.count({
      where: {
        tenantId,
        notifyBreakingNews: true,
        recordDate: { gte: startDate, lte: endDate },
        ...(userIds ? { userId: { in: userIds } } : {}),
      },
    });
  },

  /**
   * 最新N件のレコードを取得（createdAt降順）。
   * notifyBreakingNews=false のレコードは速報対象外のため除外する。
   */
  findLatest(
    tenantId: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
    userIds?: string[],
  ) {
    return prisma.salesRecord.findMany({
      where: {
        tenantId,
        notifyBreakingNews: true,
        ...(startDate || endDate
          ? {
              recordDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(userIds ? { userId: { in: userIds } } : {}),
      },
      include: { user: { include: { department: true } }, dataType: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  createMany(
    tenantId: number,
    data: {
      userId: string;
      value: number;
      description?: string;
      recordDate: Date;
      customFields?: Record<string, string>;
      dataTypeId?: number;
    }[],
  ) {
    return prisma.salesRecord.createMany({
      data: data.map((d) => ({ ...d, tenantId })),
    });
  },
};
