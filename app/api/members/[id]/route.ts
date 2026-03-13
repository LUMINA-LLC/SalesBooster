import { NextRequest } from 'next/server';
import { memberController } from '@/server/controllers/memberController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return memberController.update(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return memberController.delete(request, id);
}
