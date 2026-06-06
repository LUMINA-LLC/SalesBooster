import { settingsService } from './settingsService';
import {
  formatSalesNotificationMessage,
  type NotificationData,
} from './notificationFormatter';
import { isHttpsUrl } from '@/lib/url';
import { logger } from '@/lib/logger';

interface GoogleChatConfig {
  webhookUrl: string;
  /** 管理画面で設定された本文テンプレート（未設定時はデフォルトフォーマット） */
  messageTemplate?: string;
  /** メンバーの顔写真をカード内に表示するか ('true' / 'false') */
  sendMemberImage?: string;
}

/**
 * Google Chat の textParagraph は HTML サブセットを解釈するため、
 * 本文中の特殊文字をエスケープしてから改行を <br> に変換する。
 */
function toHtmlText(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/** 顔写真付き Cards v2 ボディ */
function buildCardBody(message: string, imageUrl: string) {
  return {
    cardsV2: [
      {
        cardId: 'sales-notification',
        card: {
          sections: [
            {
              widgets: [
                { image: { imageUrl } },
                { textParagraph: { text: toHtmlText(message) } },
              ],
            },
          ],
        },
      },
    ],
  };
}

async function postToWebhook(webhookUrl: string, body: unknown) {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(body),
  });
}

export const googleChatNotificationService = {
  async sendSalesNotification(
    tenantId: number,
    data: NotificationData,
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
      logger.warn('Google Chat config is incomplete, skipping notification', {
        tenantId,
      });
      return;
    }

    const message = formatSalesNotificationMessage(
      data,
      config.messageTemplate,
    );

    const imageUrl =
      config.sendMemberImage === 'true' && isHttpsUrl(data.memberImageUrl)
        ? data.memberImageUrl
        : null;

    // 顔写真付きカードでの送信を試み、失敗（画像URLが無効等）した場合は
    // 本文のみのプレーンテキストで再送する。画像の不備で速報本文ごと
    // 届かなくなるのを防ぐ。
    if (imageUrl) {
      const cardRes = await postToWebhook(
        config.webhookUrl,
        buildCardBody(message, imageUrl),
      );
      if (cardRes.ok) {
        logger.info('Google Chat notification sent', { tenantId });
        return;
      }
      const body = await cardRes.text().catch(() => '');
      logger.warn(
        'Google Chat card with image failed, retrying as text only',
        { tenantId, status: cardRes.status, body },
      );
    }

    const res = await postToWebhook(config.webhookUrl, { text: message });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Google Chat Webhook error: ${res.status} ${body}`);
    }

    logger.info('Google Chat notification sent', { tenantId });
  },

  async sendTestMessage(
    webhookUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await postToWebhook(webhookUrl, {
        text: 'Miroku からのテスト通知です。接続に成功しました！',
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
