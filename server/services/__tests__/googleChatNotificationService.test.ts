import { describe, it, expect, beforeEach, vi } from 'vitest';
import { googleChatNotificationService } from '../googleChatNotificationService';
import { settingsService } from '../settingsService';

vi.mock('../settingsService');

const mockedSettingsService = vi.mocked(settingsService);

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('googleChatNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendSalesNotification', () => {
    const notificationData = {
      memberName: '田中太郎',
      memberImageUrl: 'https://example.com/avatar.png',
      value: 1000,
      recordDate: new Date('2024-06-15'),
      createdAt: new Date('2024-06-15T10:00:00Z'),
      dataTypeName: '売上',
      unit: 'YEN',
      customFields: null,
      customFieldDefs: [],
    };

    it('CONNECTED状態で有効なwebhookUrlがある場合通知を送信する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { webhookUrl: 'https://chat.googleapis.com/webhook/xxx' },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://chat.googleapis.com/webhook/xxx',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('田中太郎');
      expect(body.text).toContain('1,000');
    });

    it('統合がない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue(
        null as never,
      );

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('CONNECTED以外の場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'DISCONNECTED',
        config: { webhookUrl: 'https://example.com' },
      } as never);

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('webhookUrlがない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {},
      } as never);

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sendMemberImage=trueかつhttps画像がある場合はCards v2で送信する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {
          webhookUrl: 'https://chat.googleapis.com/webhook/xxx',
          sendMemberImage: 'true',
        },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toBeUndefined();
      expect(body.cardsV2).toBeDefined();
      const widgets = body.cardsV2[0].card.sections[0].widgets;
      expect(widgets[0].image.imageUrl).toBe('https://example.com/avatar.png');
      expect(widgets[1].textParagraph.text).toContain('田中太郎');
    });

    it('sendMemberImage=falseの場合はプレーンテキストで送信する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {
          webhookUrl: 'https://chat.googleapis.com/webhook/xxx',
          sendMemberImage: 'false',
        },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.cardsV2).toBeUndefined();
      expect(body.text).toContain('田中太郎');
    });

    it('messageTemplateが設定されている場合テンプレートで送信する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {
          webhookUrl: 'https://chat.googleapis.com/webhook/xxx',
          messageTemplate: '{担当}が達成',
        },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toBe('田中太郎が達成');
    });

    it('カード本文のHTML特殊文字をエスケープする', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {
          webhookUrl: 'https://chat.googleapis.com/webhook/xxx',
          sendMemberImage: 'true',
          messageTemplate: '{担当}',
        },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await googleChatNotificationService.sendSalesNotification(1, {
        ...notificationData,
        memberName: 'A & B <太郎>',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const text = body.cardsV2[0].card.sections[0].widgets[1].textParagraph
        .text as string;
      expect(text).toBe('A &amp; B &lt;太郎&gt;');
    });

    it('画像付きカードが失敗した場合は本文のみで再送する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {
          webhookUrl: 'https://chat.googleapis.com/webhook/xxx',
          sendMemberImage: 'true',
        },
      } as never);
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve('invalid image'),
        })
        .mockResolvedValueOnce({ ok: true });

      await googleChatNotificationService.sendSalesNotification(
        1,
        notificationData,
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const firstBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const secondBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(firstBody.cardsV2).toBeDefined();
      expect(secondBody.text).toContain('田中太郎');
      expect(secondBody.cardsV2).toBeUndefined();
    });

    it('fetchがエラーを返した場合例外をスローする', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { webhookUrl: 'https://chat.googleapis.com/webhook/xxx' },
      } as never);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(
        googleChatNotificationService.sendSalesNotification(
          1,
          notificationData,
        ),
      ).rejects.toThrow('Google Chat Webhook error: 500 Internal Server Error');
    });
  });

  describe('sendTestMessage', () => {
    it('成功時にsuccess: trueを返す', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await googleChatNotificationService.sendTestMessage(
        'https://chat.googleapis.com/webhook/test',
      );

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://chat.googleapis.com/webhook/test',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('fetchがエラーを返した場合success: falseとエラーメッセージを返す', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      const result = await googleChatNotificationService.sendTestMessage(
        'https://chat.googleapis.com/webhook/test',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('fetchが例外をスローした場合success: falseとエラーメッセージを返す', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await googleChatNotificationService.sendTestMessage(
        'https://chat.googleapis.com/webhook/test',
      );

      expect(result).toEqual({ success: false, error: 'Network error' });
    });
  });
});
