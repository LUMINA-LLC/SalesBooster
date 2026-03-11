import { NextRequest } from 'next/server';
import { settingsService } from '../services/settingsService';
import { auditLogService } from '../services/auditLogService';
import { lineNotificationService } from '../services/lineNotificationService';
import { googleChatNotificationService } from '../services/googleChatNotificationService';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const settingsController = {
  async getSettings(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const data = await settingsService.getAllSettings(tenantId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return ApiResponse.serverError();
    }
  },

  async updateSettings(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();

      for (const [key, value] of Object.entries(body)) {
        await settingsService.updateSetting(tenantId, key, String(value));
      }

      auditLogService.create(tenantId, {
        request,
        action: 'SETTINGS_UPDATE',
        detail: `システム設定を更新`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update settings');
    }
  },

  async getIntegrations(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const data = await settingsService.getAllIntegrations(tenantId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      return ApiResponse.serverError();
    }
  },

  async updateIntegrationStatus(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { status } = body;

      if (!status) {
        return ApiResponse.badRequest('status is required');
      }

      const integration = await settingsService.updateIntegrationStatus(tenantId, id, status);

      auditLogService.create(tenantId, {
        request,
        action: 'INTEGRATION_STATUS_UPDATE',
        detail: `連携ID:${id}のステータスを${status}に変更`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(integration);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update integration');
    }
  },

  async updateIntegrationConfig(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { config } = body;

      if (!config || typeof config !== 'object') {
        return ApiResponse.badRequest('config is required');
      }

      const integration = await settingsService.updateIntegrationConfig(tenantId, id, config);

      auditLogService.create(tenantId, {
        request,
        action: 'INTEGRATION_STATUS_UPDATE',
        detail: `連携ID:${id}の設定を更新`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(integration);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update integration config');
    }
  },

  async testLineNotification(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const body = await request.json();
      const { channelAccessToken, groupId } = body;

      if (!channelAccessToken || !groupId) {
        return ApiResponse.badRequest('channelAccessToken and groupId are required');
      }

      const result = await lineNotificationService.sendTestMessage(channelAccessToken, groupId);

      if (!result.success) {
        return ApiResponse.badRequest(result.error || 'テスト送信に失敗しました');
      }

      return ApiResponse.success({ message: 'テスト送信に成功しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to send test notification');
    }
  },

  async testGoogleChatNotification(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const body = await request.json();
      const { webhookUrl } = body;

      if (!webhookUrl) {
        return ApiResponse.badRequest('webhookUrl is required');
      }

      const result = await googleChatNotificationService.sendTestMessage(webhookUrl);

      if (!result.success) {
        return ApiResponse.badRequest(result.error || 'テスト送信に失敗しました');
      }

      return ApiResponse.success({ message: 'テスト送信に成功しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to send test notification');
    }
  },
};
