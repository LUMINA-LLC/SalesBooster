import { NextRequest } from 'next/server';
import { graphConfigService } from '../services/graphConfigService';
import { auditLogService } from '../services/auditLogService';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const graphConfigController = {
  async getConfig(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const config = await graphConfigService.getConfig(tenantId);
      return ApiResponse.success(config);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch graph config');
    }
  },

  async updateConfig(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();

      await graphConfigService.updateConfig(tenantId, body);

      auditLogService
        .create(tenantId, {
          request,
          action: 'SETTINGS_UPDATE',
          detail: 'グラフ設定を更新',
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update graph config');
    }
  },
};
