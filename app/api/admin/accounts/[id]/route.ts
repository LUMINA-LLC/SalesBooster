import { NextRequest } from 'next/server';
import { superAdminController } from '@/server/controllers/superAdminController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return superAdminController.updateAccount(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return superAdminController.deleteAccount(request, id);
}
