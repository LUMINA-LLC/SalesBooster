import { NextRequest } from 'next/server';
import { aiChatController } from '@/server/controllers/aiChatController';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return aiChatController.getSession(request, Number(id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return aiChatController.deleteSession(request, Number(id));
}
