import { NextRequest } from 'next/server';
import { tenantController } from '@/server/controllers/tenantController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return tenantController.updateLicense(request, Number(id));
}
