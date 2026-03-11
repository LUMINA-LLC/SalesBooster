import { NextRequest } from 'next/server';
import { getTenantId, requireAdmin } from '../lib/auth';
import { setupService } from '../services/setupService';
import { ApiResponse } from '../lib/apiResponse';

export const setupController = {
  async getSetupStatus(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const status = await setupService.getSetupStatus(tenantId);
      if (!status) {
        return ApiResponse.notFound('テナントが見つかりません');
      }
      return ApiResponse.success(status);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch setup status');
    }
  },

  async updateSetupStatus(request: NextRequest) {
    try {
      await requireAdmin(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { setupCompleted } = body;

      const result = await setupService.updateSetupCompleted(tenantId, setupCompleted === true);
      return ApiResponse.success(result);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update setup status');
    }
  },
};
