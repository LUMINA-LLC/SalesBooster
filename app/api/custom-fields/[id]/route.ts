import { NextRequest } from 'next/server';
import { customFieldController } from '@/server/controllers/customFieldController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return customFieldController.updateCustomField(request, Number(id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return customFieldController.deleteCustomField(request, Number(id));
}
