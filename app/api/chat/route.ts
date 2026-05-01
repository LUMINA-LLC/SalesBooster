import { NextRequest } from 'next/server';
import { aiChatController } from '@/server/controllers/aiChatController';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return aiChatController.chat(request);
}
