import { NextRequest } from 'next/server';
import { displayService } from '../services/displayService';
import { auditLogService } from '../services/auditLogService';
import { VALID_TRANSITIONS } from '@/types/display';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const displayController = {
  async getConfig(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const config = await displayService.getConfig(tenantId);
      return ApiResponse.success(config);
    } catch (error) {
      console.error('Failed to fetch display config:', error);
      return ApiResponse.serverError();
    }
  },

  async updateConfig(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();

      if (!body.views || !Array.isArray(body.views)) {
        return ApiResponse.badRequest('views is required');
      }

      if (body.transition && !VALID_TRANSITIONS.includes(body.transition)) {
        return ApiResponse.badRequest('Invalid transition type');
      }

      await displayService.updateConfig(tenantId, body);

      auditLogService
        .create(tenantId, {
          request,
          action: 'DISPLAY_CONFIG_UPDATE',
          detail: `ディスプレイ設定を更新`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update display config');
    }
  },
};
