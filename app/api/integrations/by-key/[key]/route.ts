import { NextRequest } from 'next/server';
import { settingsController } from '@/server/controllers/settingsController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return settingsController.upsertIntegrationByKey(
    request,
    decodeURIComponent(key),
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return settingsController.upsertIntegrationByKey(
    request,
    decodeURIComponent(key),
  );
}
