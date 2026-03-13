import { prisma } from '@/lib/prisma';
import { CustomSlideType } from '@prisma/client';

export const customSlideRepository = {
  findAll(tenantId: number) {
    return prisma.customSlide.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.customSlide.findFirst({ where: { id, tenantId } });
  },

  count(tenantId: number) {
    return prisma.customSlide.count({ where: { tenantId } });
  },

  create(
    tenantId: number,
    data: {
      slideType: CustomSlideType;
      title: string;
      content: string;
      imageUrl?: string;
    },
  ) {
    return prisma.customSlide.create({ data: { ...data, tenantId } });
  },

  update(
    id: number,
    tenantId: number,
    data: {
      title?: string;
      content?: string;
      imageUrl?: string;
    },
  ) {
    return prisma.customSlide.updateMany({ where: { id, tenantId }, data });
  },

  hardDelete(id: number, tenantId: number) {
    return prisma.customSlide.deleteMany({ where: { id, tenantId } });
  },
};
