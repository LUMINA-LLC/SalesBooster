import { NextRequest } from 'next/server';
import { graphConfigController } from '@/server/controllers/graphConfigController';

export async function GET(request: NextRequest) {
  return graphConfigController.getConfig(request);
}

export async function PUT(request: NextRequest) {
  return graphConfigController.updateConfig(request);
}
