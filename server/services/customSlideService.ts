import { CustomSlideType } from '@prisma/client';
import { customSlideRepository } from '../repositories/customSlideRepository';

const MAX_SLIDES = 10;

export const customSlideService = {
  /** configId 指定時はその設定に帰属するスライドのみ返す。 */
  async getAll(tenantId: number, displayConfigId?: number) {
    return customSlideRepository.findAll(tenantId, displayConfigId);
  },

  async create(
    tenantId: number,
    data: {
      slideType: CustomSlideType;
      title: string;
      content: string;
      imageUrl?: string;
      displayConfigId?: number | null;
    },
  ) {
    // 上限はスライドが帰属する設定単位で判定する
    const count = await customSlideRepository.count(
      tenantId,
      data.displayConfigId ?? undefined,
    );
    if (count >= MAX_SLIDES) {
      throw new Error(`カスタムスライドは最大${MAX_SLIDES}件までです`);
    }

    return customSlideRepository.create(tenantId, {
      slideType: data.slideType,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      displayConfigId: data.displayConfigId ?? null,
    });
  },

  async update(
    tenantId: number,
    id: number,
    data: {
      title?: string;
      content?: string;
      imageUrl?: string;
    },
  ) {
    const existing = await customSlideRepository.findById(id, tenantId);
    if (!existing) return null;
    await customSlideRepository.update(id, tenantId, data);
    return customSlideRepository.findById(id, tenantId);
  },

  async delete(tenantId: number, id: number) {
    const existing = await customSlideRepository.findById(id, tenantId);
    if (!existing) return null;
    await customSlideRepository.hardDelete(id, tenantId);
    return existing;
  },
};
