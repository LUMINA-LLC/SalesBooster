import { prisma } from '@/lib/prisma';
import { CustomSlideType } from '@prisma/client';

export const customSlideRepository = {
  /** configId 指定時はその設定に帰属するスライドのみ返す。 */
  findAll(tenantId: number, displayConfigId?: number) {
    return prisma.customSlide.findMany({
      where: {
        tenantId,
        ...(displayConfigId !== undefined ? { displayConfigId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.customSlide.findFirst({ where: { id, tenantId } });
  },

  /** configId 指定時はその設定に帰属するスライド数を数える。 */
  count(tenantId: number, displayConfigId?: number) {
    return prisma.customSlide.count({
      where: {
        tenantId,
        ...(displayConfigId !== undefined ? { displayConfigId } : {}),
      },
    });
  },

  create(
    tenantId: number,
    data: {
      slideType: CustomSlideType;
      title: string;
      content: string;
      imageUrl?: string;
      displayConfigId?: number | null;
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
