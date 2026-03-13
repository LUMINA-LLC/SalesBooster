import { NextRequest } from 'next/server';
import { salesController } from '@/server/controllers/salesController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return salesController.updateSalesRecord(request, Number(id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return salesController.deleteSalesRecord(request, Number(id));
}
