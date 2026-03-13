import { NextRequest } from 'next/server';
import { tenantController } from '@/server/controllers/tenantController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return tenantController.getByIdWithDetails(request, Number(id));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return tenantController.update(request, Number(id));
}
