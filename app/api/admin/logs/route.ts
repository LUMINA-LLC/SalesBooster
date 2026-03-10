import { NextRequest } from 'next/server';
import { superAdminController } from '@/server/controllers/superAdminController';

export async function GET(request: NextRequest) {
  return superAdminController.getAuditLogs(request);
}
