import { settingsService } from './settingsService';
import {
  formatSalesNotificationMessage,
  type NotificationData,
} from './notificationFormatter';
import { isHttpsUrl } from '@/lib/url';
import { logger } from '@/lib/logger';

interface LineConfig {
  channelAccessToken: string;
  groupId: string;
  /** 管理画面で設定された本文テンプレート（未設定時はデフォルトフォーマット） */
  messageTemplate?: string;
  /** メンバーの顔写真を画像メッセージとして添付するか ('true' / 'false') */
  sendMemberImage?: string;
}

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

async function pushMessages(
  channelAccessToken: string,
  groupId: string,
  messages: Record<string, unknown>[],
) {
  return fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({ to: groupId, messages }),
  });
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
      logger.warn('LINE config is incomplete, skipping notification', {
        tenantId,
      });
      return;
    }

    const message = formatSalesNotificationMessage(
      data,
      config.messageTemplate,
    );

    const textMessage = { type: 'text', text: message };

    // 顔写真送信が有効、かつ公開HTTPS URLがある場合のみ画像メッセージを追加
    const includeImage =
      config.sendMemberImage === 'true' && isHttpsUrl(data.memberImageUrl);
    const messages: Record<string, unknown>[] = includeImage
      ? [
          textMessage,
          {
            type: 'image',
            originalContentUrl: data.memberImageUrl,
            previewImageUrl: data.memberImageUrl,
          },
        ]
      : [textMessage];

    const res = await pushMessages(
      config.channelAccessToken,
      config.groupId,
      messages,
    );

    if (res.ok) {
      logger.info('LINE notification sent', { tenantId });
      return;
    }

    // 画像付きで失敗した場合は、本文テキストのみで再送する。
    // 画像URLが LINE 側で無効でも速報本文が届くようにする。
    if (includeImage) {
      const body = await res.json().catch(() => ({}));
      logger.warn('LINE push with image failed, retrying as text only', {
        tenantId,
        status: res.status,
        message: body.message,
      });
      const retry = await pushMessages(
        config.channelAccessToken,
        config.groupId,
        [textMessage],
      );
      if (retry.ok) {
        logger.info('LINE notification sent (text only)', { tenantId });
        return;
      }
      const retryBody = await retry.json().catch(() => ({}));
      throw new Error(
        `LINE API error: ${retry.status} ${retryBody.message || ''}`,
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(`LINE API error: ${res.status} ${body.message || ''}`);
  },

  async sendTestMessage(
    channelAccessToken: string,
    groupId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await pushMessages(channelAccessToken, groupId, [
        {
          type: 'text',
          text: 'Miroku からのテスト通知です。接続に成功しました！',
        },
      ]);

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
