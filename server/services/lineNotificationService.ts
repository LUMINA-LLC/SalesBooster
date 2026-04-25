import { settingsService } from './settingsService';
import {
  formatSalesNotificationMessage,
  type NotificationData,
} from './notificationFormatter';

interface LineConfig {
  channelAccessToken: string;
  groupId: string;
}

export const lineNotificationService = {
  async sendSalesNotification(
    tenantId: number,
    data: NotificationData,
  ): Promise<void> {
    const integration = await settingsService.getIntegrationByKey(
      tenantId,
      'LINE',
    );

    if (!integration || integration.status !== 'CONNECTED') {
      return;
    }

    const config = integration.config as LineConfig | null;
    if (!config?.channelAccessToken || !config?.groupId) {
      console.warn('LINE config is incomplete, skipping notification');
      return;
    }

    const message = formatSalesNotificationMessage(data);

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.channelAccessToken}`,
      },
      body: JSON.stringify({
        to: config.groupId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`LINE API error: ${res.status} ${body.message || ''}`);
    }
  },

  async sendTestMessage(
    channelAccessToken: string,
    groupId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          to: groupId,
          messages: [
            {
              type: 'text',
              text: 'Miroku からのテスト通知です。接続に成功しました！',
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { success: false, error: body.message || `HTTP ${res.status}` };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
};
