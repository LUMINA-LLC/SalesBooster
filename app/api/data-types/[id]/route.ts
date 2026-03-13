import { NextRequest } from 'next/server';
import { dataTypeController } from '@/server/controllers/dataTypeController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return dataTypeController.update(request, Number(id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return dataTypeController.delete(request, Number(id));
}
