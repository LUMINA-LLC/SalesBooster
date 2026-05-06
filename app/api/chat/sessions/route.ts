import { NextRequest } from 'next/server';
import { aiChatController } from '@/server/controllers/aiChatController';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return aiChatController.listSessions(request);
}

export async function DELETE(request: NextRequest) {
  return aiChatController.deleteAllSessions(request);
}
