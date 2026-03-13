import { NextRequest } from 'next/server';
import { customSlideController } from '@/server/controllers/customSlideController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return customSlideController.updateCustomSlide(request, Number(id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return customSlideController.deleteCustomSlide(request, Number(id));
}
