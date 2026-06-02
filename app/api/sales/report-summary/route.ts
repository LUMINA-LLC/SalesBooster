import { NextRequest } from 'next/server';
import { salesController } from '@/server/controllers/salesController';

export async function GET(request: NextRequest) {
  return salesController.getReportSummary(request);
}
