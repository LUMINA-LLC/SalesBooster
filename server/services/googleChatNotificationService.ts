import { settingsService } from './settingsService';

interface GoogleChatConfig {
  webhookUrl: string;
}

interface SalesNotificationData {
  memberName: string;
  value: number;
  recordDate: Date;
}

export const googleChatNotificationService = {
  async sendSalesNotification(
    tenantId: number,
    data: SalesNotificationData,
  ): Promise<void> {
    const integration = await settingsService.getIntegrationByKey(
      tenantId,
      'GOOGLE_CHAT',
    );

    if (!integration || integration.status !== 'CONNECTED') {
      return;
    }

    const config = integration.config as GoogleChatConfig | null;
    if (!config?.webhookUrl) {
      console.warn('Google Chat config is incomplete, skipping notification');
      return;
    }

    const dateStr = new Date(data.recordDate).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const message = `データ登録\n\n担当: ${data.memberName}\n値: ${data.value}\n日付: ${dateStr}`;

    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text: message }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Google Chat Webhook error: ${res.status} ${body}`);
    }
  },

  async sendTestMessage(
    webhookUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          text: 'Miroku からのテスト通知です。接続に成功しました！',
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { success: false, error: body || `HTTP ${res.status}` };
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
