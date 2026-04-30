import { NextRequest } from 'next/server';
import { memberController } from '@/server/controllers/memberController';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return memberController.changePassword(request, id);
}
