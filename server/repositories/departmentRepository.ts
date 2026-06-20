import { prisma } from '@/server/lib/prisma';

export const departmentRepository = {
  findAll(tenantId: number) {
    return prisma.department.findMany({
      where: { tenantId },
      orderBy: { id: 'asc' },
    });
  },
};
