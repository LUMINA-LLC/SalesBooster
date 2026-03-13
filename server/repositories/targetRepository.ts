import { prisma } from '@/lib/prisma';

export const targetRepository = {
  findAll(tenantId: number) {
    return prisma.target.findMany({
      where: { tenantId, periodType: 'MONTHLY' },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });
  },

  findByUserAndPeriod(
    userId: string,
    year: number,
    month: number,
    tenantId: number,
    dataTypeId?: number,
  ) {
    return prisma.target.findFirst({
      where: {
        tenantId,
        userId,
        year,
        month,
        periodType: 'MONTHLY',
        dataTypeId: dataTypeId ?? null,
      },
    });
  },

  findByUsersAndPeriod(
    userIds: string[],
    year: number,
    month: number,
    tenantId: number,
  ) {
    return prisma.target.findMany({
      where: {
        userId: { in: userIds },
        year,
        month,
        tenantId,
        periodType: 'MONTHLY',
      },
    });
  },

  findByUsersAndPeriodRange(
    userIds: string[],
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number,
    tenantId: number,
  ) {
    const conditions: { year: number; month: number }[] = [];
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      conditions.push({ year: y, month: m });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return prisma.target.findMany({
      where: {
        userId: { in: userIds },
        tenantId,
        periodType: 'MONTHLY',
        OR: conditions,
      },
    });
  },

  async upsert(
    tenantId: number,
    data: {
      userId: string;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    },
  ) {
    const existing = await prisma.target.findFirst({
      where: {
        tenantId,
        userId: data.userId,
        year: data.year,
        month: data.month,
        periodType: 'MONTHLY',
        dataTypeId: data.dataTypeId ?? null,
      },
    });
    if (existing) {
      return prisma.target.update({
        where: { id: existing.id },
        data: { value: data.value },
      });
    }
    return prisma.target.create({
      data: {
        userId: data.userId,
        value: data.value,
        year: data.year,
        month: data.month,
        periodType: 'MONTHLY',
        tenantId,
        dataTypeId: data.dataTypeId ?? null,
      },
    });
  },

  async bulkUpsert(
    tenantId: number,
    targets: {
      userId: string;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    }[],
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const t of targets) {
        const existing = await tx.target.findFirst({
          where: {
            tenantId,
            userId: t.userId,
            year: t.year,
            month: t.month,
            periodType: 'MONTHLY',
            dataTypeId: t.dataTypeId ?? null,
          },
        });
        if (existing) {
          results.push(
            await tx.target.update({
              where: { id: existing.id },
              data: { value: t.value },
            }),
          );
        } else {
          results.push(
            await tx.target.create({
              data: {
                userId: t.userId,
                value: t.value,
                year: t.year,
                month: t.month,
                periodType: 'MONTHLY',
                tenantId,
                dataTypeId: t.dataTypeId ?? null,
              },
            }),
          );
        }
      }
      return results;
    });
  },

  findByYearAndDataType(tenantId: number, year: number, dataTypeId?: number) {
    return prisma.target.findMany({
      where: {
        tenantId,
        year,
        periodType: 'MONTHLY',
        dataTypeId: dataTypeId ?? null,
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ userId: 'asc' }, { month: 'asc' }],
    });
  },
};
