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
      value: 1000,
      recordDate: new Date('2024-06-15'),
    };

    it('CONNECTED状態で有効なwebhookUrlがある場合通知を送信する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { webhookUrl: 'https://chat.googleapis.com/webhook/xxx' },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await googleChatNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://chat.googleapis.com/webhook/xxx',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('田中太郎');
      expect(body.text).toContain('1000');
    });

    it('統合がない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue(null as never);

      await googleChatNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('CONNECTED以外の場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'DISCONNECTED',
        config: { webhookUrl: 'https://example.com' },
      } as never);

      await googleChatNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('webhookUrlがない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: {},
      } as never);

      await googleChatNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
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
        googleChatNotificationService.sendSalesNotification(1, notificationData),
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
