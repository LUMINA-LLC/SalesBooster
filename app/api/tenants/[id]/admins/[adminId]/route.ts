import { NextRequest } from 'next/server';
import { tenantController } from '@/server/controllers/tenantController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adminId: string }> },
) {
  const { id, adminId } = await params;
  return tenantController.updateAdmin(request, Number(id), adminId);
}
