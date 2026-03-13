import { describe, it, expect, beforeEach, vi } from 'vitest';
import { settingsService } from '../settingsService';
import { systemSettingRepository } from '../../repositories/systemSettingRepository';
import { integrationRepository } from '../../repositories/integrationRepository';
import { IntegrationStatus } from '@prisma/client';

vi.mock('../../repositories/systemSettingRepository');
vi.mock('../../repositories/integrationRepository');

const mockedSettingRepo = vi.mocked(systemSettingRepository);
const mockedIntegrationRepo = vi.mocked(integrationRepository);

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllSettings', () => {
    it('設定をkey-valueマップとして返す', async () => {
      mockedSettingRepo.findAll.mockResolvedValue([
        { key: 'THEME', value: 'dark' },
        { key: 'LANGUAGE', value: 'ja' },
      ] as never);

      const result = await settingsService.getAllSettings(1);

      expect(mockedSettingRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual({ THEME: 'dark', LANGUAGE: 'ja' });
    });

    it('設定がない場合空オブジェクトを返す', async () => {
      mockedSettingRepo.findAll.mockResolvedValue([]);

      const result = await settingsService.getAllSettings(1);

      expect(result).toEqual({});
    });
  });

  describe('updateSetting', () => {
    it('設定をupsertする', async () => {
      mockedSettingRepo.upsert.mockResolvedValue({ key: 'THEME', value: 'light' } as never);

      const result = await settingsService.updateSetting(1, 'THEME', 'light');

      expect(mockedSettingRepo.upsert).toHaveBeenCalledWith(1, 'THEME', 'light');
      expect(result).toEqual({ key: 'THEME', value: 'light' });
    });
  });

  describe('getAllIntegrations', () => {
    it('テナントの全統合を返す', async () => {
      const mockIntegrations = [{ id: 1, serviceKey: 'LINE' }];
      mockedIntegrationRepo.findAll.mockResolvedValue(mockIntegrations as never);

      const result = await settingsService.getAllIntegrations(1);

      expect(mockedIntegrationRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockIntegrations);
    });
  });

  describe('updateIntegrationStatus', () => {
    it('統合のステータスを更新する', async () => {
      mockedIntegrationRepo.updateStatus.mockResolvedValue({ id: 1 } as never);

      await settingsService.updateIntegrationStatus(1, 1, 'CONNECTED' as IntegrationStatus);

      expect(mockedIntegrationRepo.updateStatus).toHaveBeenCalledWith(1, 1, 'CONNECTED');
    });
  });

  describe('updateIntegrationConfig', () => {
    it('統合の設定を更新する', async () => {
      mockedIntegrationRepo.updateConfig.mockResolvedValue({ id: 1 } as never);

      await settingsService.updateIntegrationConfig(1, 1, { webhookUrl: 'https://example.com' });

      expect(mockedIntegrationRepo.updateConfig).toHaveBeenCalledWith(1, 1, { webhookUrl: 'https://example.com' });
    });
  });

  describe('getIntegrationByKey', () => {
    it('serviceKeyで統合を取得する', async () => {
      const mockIntegration = { id: 1, serviceKey: 'LINE' };
      mockedIntegrationRepo.findByKey.mockResolvedValue(mockIntegration as never);

      const result = await settingsService.getIntegrationByKey(1, 'LINE');

      expect(mockedIntegrationRepo.findByKey).toHaveBeenCalledWith('LINE', 1);
      expect(result).toEqual(mockIntegration);
    });
  });

  describe('upsertIntegrationByKey', () => {
    it('serviceKeyで統合をupsertする', async () => {
      mockedIntegrationRepo.upsertByKey.mockResolvedValue({ id: 1 } as never);

      await settingsService.upsertIntegrationByKey(1, 'GOOGLE_CHAT', {
        status: 'CONNECTED' as IntegrationStatus,
        config: { webhookUrl: 'https://example.com' },
      });

      expect(mockedIntegrationRepo.upsertByKey).toHaveBeenCalledWith(1, 'GOOGLE_CHAT', {
        status: 'CONNECTED',
        config: { webhookUrl: 'https://example.com' },
      });
    });
  });
});
