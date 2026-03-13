import { NextRequest } from 'next/server';
import { settingsController } from '@/server/controllers/settingsController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return settingsController.updateIntegrationStatus(request, Number(id));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return settingsController.updateIntegrationConfig(request, Number(id));
}
