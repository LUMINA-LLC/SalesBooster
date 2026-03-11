import { NextRequest } from 'next/server';
import { customSlideService } from '../services/customSlideService';
import { auditLogService } from '../services/auditLogService';
import { supabase } from '@/lib/supabase';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

const BUCKET_NAME = 'custom-slides';

export const customSlideController = {
  async getCustomSlides(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const slides = await customSlideService.getAll(tenantId);
      return ApiResponse.success(slides);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch custom slides');
    }
  },

  async createCustomSlide(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { slideType, title, content, imageUrl } = body;

      if (!slideType || !['IMAGE', 'YOUTUBE', 'TEXT'].includes(slideType)) {
        return ApiResponse.badRequest('slideType must be IMAGE, YOUTUBE, or TEXT');
      }

      if (slideType === 'IMAGE' && !imageUrl) {
        return ApiResponse.badRequest('IMAGE type requires imageUrl');
      }

      if (slideType === 'YOUTUBE' && !content) {
        return ApiResponse.badRequest('YOUTUBE type requires content (video URL or ID)');
      }

      if (slideType === 'TEXT' && !content) {
        return ApiResponse.badRequest('TEXT type requires content');
      }

      const slide = await customSlideService.create(tenantId, {
        slideType,
        title: title || '',
        content: content || '',
        imageUrl: imageUrl || '',
      });

      auditLogService.create(tenantId, {
        request,
        action: 'CUSTOM_SLIDE_CREATE',
        detail: `カスタムスライド「${title || slideType}」を追加`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(slide);
    } catch (error) {
      if (error instanceof Error && error.message.includes('最大')) {
        return ApiResponse.badRequest(error.message);
      }
      return ApiResponse.fromError(error, 'Failed to create custom slide');
    }
  },

  async updateCustomSlide(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { title, content, imageUrl } = body;
      const updated = await customSlideService.update(tenantId, id, { title, content, imageUrl });
      if (!updated) return ApiResponse.notFound('カスタムスライドが見つかりません');

      auditLogService.create(tenantId, {
        request,
        action: 'CUSTOM_SLIDE_UPDATE',
        detail: `カスタムスライドID:${id}を更新`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(updated);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update custom slide');
    }
  },

  async deleteCustomSlide(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      // スライド情報を取得して画像がある場合はStorageからも削除
      const slide = await customSlideService.getAll(tenantId).then(
        (slides) => slides.find((s) => s.id === id)
      );

      if (!slide) return ApiResponse.notFound('カスタムスライドが見つかりません');

      // IMAGE タイプで Supabase Storage のURLを持つ場合は画像を削除
      if (slide.slideType === 'IMAGE' && slide.imageUrl) {
        const pathMatch = slide.imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        if (pathMatch) {
          supabase.storage
            .from(BUCKET_NAME)
            .remove([pathMatch[1]])
            .catch((err) => console.error('Storage delete failed:', err));
        }
      }

      const deleted = await customSlideService.delete(tenantId, id);
      if (!deleted) return ApiResponse.notFound('カスタムスライドが見つかりません');

      auditLogService.create(tenantId, {
        request,
        action: 'CUSTOM_SLIDE_DELETE',
        detail: `カスタムスライドを削除`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ message: '削除しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete custom slide');
    }
  },
};
