import { NextRequest } from 'next/server';
import { tenantController } from '@/server/controllers/tenantController';
import { getTenantId } from '@/server/lib/auth';
import { ApiResponse } from '@/server/lib/apiResponse';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    return tenantController.getLicenseStatus(request, tenantId);
  } catch {
    return ApiResponse.serverError();
  }
}
