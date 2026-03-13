import { prisma } from '@/lib/prisma';

export const groupTargetRepository = {
  findByYearAndDataType(tenantId: number, year: number, dataTypeId?: number) {
    return prisma.groupTarget.findMany({
      where: {
        tenantId,
        year,
        periodType: 'MONTHLY',
        dataTypeId: dataTypeId ?? null,
      },
      include: { group: { select: { id: true, name: true } } },
      orderBy: [{ groupId: 'asc' }, { month: 'asc' }],
    });
  },

  async upsert(
    tenantId: number,
    data: {
      groupId: number;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    },
  ) {
    const existing = await prisma.groupTarget.findFirst({
      where: {
        tenantId,
        groupId: data.groupId,
        year: data.year,
        month: data.month,
        periodType: 'MONTHLY',
        dataTypeId: data.dataTypeId ?? null,
      },
    });
    if (existing) {
      return prisma.groupTarget.update({
        where: { id: existing.id },
        data: { value: data.value },
      });
    }
    return prisma.groupTarget.create({
      data: {
        groupId: data.groupId,
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
      groupId: number;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    }[],
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const t of targets) {
        const existing = await tx.groupTarget.findFirst({
          where: {
            tenantId,
            groupId: t.groupId,
            year: t.year,
            month: t.month,
            periodType: 'MONTHLY',
            dataTypeId: t.dataTypeId ?? null,
          },
        });
        if (existing) {
          results.push(
            await tx.groupTarget.update({
              where: { id: existing.id },
              data: { value: t.value },
            }),
          );
        } else {
          results.push(
            await tx.groupTarget.create({
              data: {
                groupId: t.groupId,
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
};
