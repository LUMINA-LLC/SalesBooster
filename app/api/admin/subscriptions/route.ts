import { NextRequest } from 'next/server';
import { tenantController } from '@/server/controllers/tenantController';

export async function GET(request: NextRequest) {
  return tenantController.getSubscriptionHistories(request);
}
