import { NextRequest } from 'next/server';
import { setupController } from '@/server/controllers/setupController';

export async function GET(request: NextRequest) {
  return setupController.getSetupStatus(request);
}

export async function PUT(request: NextRequest) {
  return setupController.updateSetupStatus(request);
}
