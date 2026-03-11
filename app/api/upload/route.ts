import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/server/lib/apiResponse';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET_NAME = 'custom-slides';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return ApiResponse.badRequest('ファイルが必要です');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return ApiResponse.badRequest('JPG, PNG, WebP形式のみ対応しています');
    }

    if (file.size > MAX_FILE_SIZE) {
      return ApiResponse.badRequest('ファイルサイズは5MB以下にしてください');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `slides/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return ApiResponse.badRequest('ファイルのアップロードに失敗しました');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return ApiResponse.success({ url: urlData.publicUrl, path: filePath });
  } catch (error) {
    return ApiResponse.fromError(error, 'Failed to upload file');
  }
}
