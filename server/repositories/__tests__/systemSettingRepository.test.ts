import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { systemSettingRepository } from '../systemSettingRepository';

describe('systemSettingRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全システム設定を取得する', async () => {
      const mockSettings = [{ id: 1, key: 'theme', value: 'dark', tenantId }];
      prismaMock.systemSetting.findMany.mockResolvedValue(mockSettings);

      const result = await systemSettingRepository.findAll(tenantId);

      expect(prismaMock.systemSetting.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { key: 'asc' },
      });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('findByKey', () => {
    it('キーとテナントIDでシステム設定を取得する', async () => {
      const mockSetting = { id: 1, key: 'theme', value: 'dark', tenantId };
      prismaMock.systemSetting.findFirst.mockResolvedValue(mockSetting);

      const result = await systemSettingRepository.findByKey('theme', tenantId);

      expect(prismaMock.systemSetting.findFirst).toHaveBeenCalledWith({
        where: { key: 'theme', tenantId },
      });
      expect(result).toEqual(mockSetting);
    });
  });

  describe('upsert', () => {
    it('システム設定をupsertする', async () => {
      const mockResult = { id: 1, key: 'theme', value: 'light', tenantId };
      prismaMock.systemSetting.upsert.mockResolvedValue(mockResult);

      const result = await systemSettingRepository.upsert(
        tenantId,
        'theme',
        'light',
      );

      expect(prismaMock.systemSetting.upsert).toHaveBeenCalledWith({
        where: { tenantId_key: { tenantId, key: 'theme' } },
        update: { value: 'light' },
        create: { key: 'theme', value: 'light', tenantId },
      });
      expect(result).toEqual(mockResult);
    });
  });
});
