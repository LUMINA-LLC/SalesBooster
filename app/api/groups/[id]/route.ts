import { NextRequest } from 'next/server';
import { groupController } from '@/server/controllers/groupController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.update(request, Number(id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.delete(request, Number(id));
}
