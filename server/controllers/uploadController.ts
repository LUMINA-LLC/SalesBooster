import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/server/lib/apiResponse';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadOptions {
  bucketName: string;
  folder: string;
  maxFileSize: number;
  allowedTypes?: string[];
  errorLabel?: string;
}

async function uploadFile(request: NextRequest, options: UploadOptions) {
  const { bucketName, folder, maxFileSize, allowedTypes = ALLOWED_IMAGE_TYPES, errorLabel = 'ファイル' } = options;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return ApiResponse.badRequest('ファイルが必要です');
    }

    if (!allowedTypes.includes(file.type)) {
      return ApiResponse.badRequest('JPG, PNG, WebP形式のみ対応しています');
    }

    if (file.size > maxFileSize) {
      const sizeMB = Math.floor(maxFileSize / (1024 * 1024));
      return ApiResponse.badRequest(`ファイルサイズは${sizeMB}MB以下にしてください`);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(`Upload error (${bucketName}):`, error);
      return ApiResponse.badRequest(`${errorLabel}のアップロードに失敗しました`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return ApiResponse.success({ url: urlData.publicUrl, path: filePath });
  } catch (error) {
    return ApiResponse.fromError(error, `Failed to upload ${errorLabel}`);
  }
}

export const uploadController = {
  uploadSlide(request: NextRequest) {
    return uploadFile(request, {
      bucketName: 'custom-slides',
      folder: 'slides',
      maxFileSize: 5 * 1024 * 1024,
      errorLabel: 'ファイル',
    });
  },

  uploadAvatar(request: NextRequest) {
    return uploadFile(request, {
      bucketName: 'member-avatars',
      folder: 'avatars',
      maxFileSize: 2 * 1024 * 1024,
      errorLabel: 'アイコン',
    });
  },
};
