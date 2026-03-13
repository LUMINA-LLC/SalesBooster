import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { integrationRepository } from '../integrationRepository';

describe('integrationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全連携設定を取得する', async () => {
      const mockIntegrations = [{ id: 1, serviceKey: 'slack', tenantId }];
      prismaMock.integration.findMany.mockResolvedValue(mockIntegrations);

      const result = await integrationRepository.findAll(tenantId);

      expect(prismaMock.integration.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual(mockIntegrations);
    });
  });

  describe('findById', () => {
    it('IDとテナントIDで連携設定を取得する', async () => {
      const mockIntegration = { id: 1, serviceKey: 'slack', tenantId };
      prismaMock.integration.findFirst.mockResolvedValue(mockIntegration);

      const result = await integrationRepository.findById(1, tenantId);

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
      });
      expect(result).toEqual(mockIntegration);
    });
  });

  describe('updateStatus', () => {
    it('連携ステータスを更新する', async () => {
      prismaMock.integration.updateMany.mockResolvedValue({ count: 1 });

      const result = await integrationRepository.updateStatus(
        1,
        tenantId,
        'CONNECTED',
      );

      expect(prismaMock.integration.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data: { status: 'CONNECTED' },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('updateConfig', () => {
    it('連携設定を更新する', async () => {
      const config = { webhookUrl: 'https://example.com' };
      prismaMock.integration.updateMany.mockResolvedValue({ count: 1 });

      const result = await integrationRepository.updateConfig(
        1,
        tenantId,
        config,
      );

      expect(prismaMock.integration.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        data: { config },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('findByKey', () => {
    it('サービスキーとテナントIDで連携設定を取得する', async () => {
      const mockIntegration = { id: 1, serviceKey: 'slack', tenantId };
      prismaMock.integration.findFirst.mockResolvedValue(mockIntegration);

      const result = await integrationRepository.findByKey('slack', tenantId);

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { serviceKey: 'slack', tenantId },
      });
      expect(result).toEqual(mockIntegration);
    });
  });

  describe('upsertByKey', () => {
    it('既存データがない場合は新規作成する', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);
      const mockCreated = {
        id: 1,
        serviceKey: 'slack',
        status: 'CONNECTED',
        tenantId,
      };
      prismaMock.integration.create.mockResolvedValue(mockCreated);

      const result = await integrationRepository.upsertByKey(
        tenantId,
        'slack',
        { status: 'CONNECTED' },
      );

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: {
          serviceKey: 'slack',
          status: 'CONNECTED',
          config: undefined,
          tenantId,
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it('既存データがある場合は更新する', async () => {
      const existing = { id: 10, serviceKey: 'slack', tenantId };
      prismaMock.integration.findFirst.mockResolvedValue(existing);
      const mockUpdated = { ...existing, status: 'CONNECTED' };
      prismaMock.integration.update.mockResolvedValue(mockUpdated);

      const result = await integrationRepository.upsertByKey(
        tenantId,
        'slack',
        { status: 'CONNECTED' },
      );

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'CONNECTED' },
      });
      expect(result).toEqual(mockUpdated);
    });
  });
});
