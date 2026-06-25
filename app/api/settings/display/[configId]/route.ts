import { NextRequest } from 'next/server';
import { displayController } from '@/server/controllers/displayController';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> },
) {
  const { configId } = await params;
  return displayController.deleteConfig(request, Number(configId));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> },
) {
  const { configId } = await params;
  return displayController.renameConfig(request, Number(configId));
}
