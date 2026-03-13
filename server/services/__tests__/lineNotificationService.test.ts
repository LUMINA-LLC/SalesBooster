import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lineNotificationService } from '../lineNotificationService';
import { settingsService } from '../settingsService';

vi.mock('../settingsService');

const mockedSettingsService = vi.mocked(settingsService);

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('lineNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendSalesNotification', () => {
    const notificationData = {
      memberName: '田中太郎',
      value: 500,
      recordDate: new Date('2024-06-15'),
    };

    it('CONNECTED状態で有効な設定がある場合LINE APIに通知を送信する', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { channelAccessToken: 'token-123', groupId: 'group-abc' },
      } as never);
      mockFetch.mockResolvedValue({ ok: true });

      await lineNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token-123',
          },
        }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.to).toBe('group-abc');
      expect(body.messages[0].text).toContain('田中太郎');
      expect(body.messages[0].text).toContain('500');
    });

    it('統合がない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue(null as never);

      await lineNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('CONNECTED以外の場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'DISCONNECTED',
        config: { channelAccessToken: 'token', groupId: 'group' },
      } as never);

      await lineNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('channelAccessTokenがない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { groupId: 'group' },
      } as never);

      await lineNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('groupIdがない場合何もしない', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { channelAccessToken: 'token' },
      } as never);

      await lineNotificationService.sendSalesNotification(1, notificationData);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('LINE APIがエラーを返した場合例外をスローする', async () => {
      mockedSettingsService.getIntegrationByKey.mockResolvedValue({
        status: 'CONNECTED',
        config: { channelAccessToken: 'token', groupId: 'group' },
      } as never);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(
        lineNotificationService.sendSalesNotification(1, notificationData),
      ).rejects.toThrow('LINE API error: 401 Unauthorized');
    });
  });

  describe('sendTestMessage', () => {
    it('成功時にsuccess: trueを返す', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await lineNotificationService.sendTestMessage('token-123', 'group-abc');

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token-123',
          },
        }),
      );
    });

    it('API エラー時にsuccess: falseとエラーメッセージを返す', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' }),
      });

      const result = await lineNotificationService.sendTestMessage('token', 'group');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad Request');
    });

    it('例外発生時にsuccess: falseとエラーメッセージを返す', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await lineNotificationService.sendTestMessage('token', 'group');

      expect(result).toEqual({ success: false, error: 'Network error' });
    });
  });
});
