import { NextRequest } from 'next/server';
import { dashboardController } from '@/server/controllers/dashboardController';

export async function GET(request: NextRequest) {
  return dashboardController.getInit(request);
}
