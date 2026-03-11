import { NextRequest } from 'next/server';
import { uploadController } from '@/server/controllers/uploadController';

export async function POST(request: NextRequest) {
  return uploadController.uploadAvatar(request);
}
