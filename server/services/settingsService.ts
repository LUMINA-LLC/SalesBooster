import { systemSettingRepository } from '../repositories/systemSettingRepository';
import { integrationRepository } from '../repositories/integrationRepository';
import { IntegrationStatus } from '@prisma/client';

export const settingsService = {
  async getAllSettings(tenantId: number) {
    const settings = await systemSettingRepository.findAll(tenantId);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return settingsMap;
  },

  async updateSetting(tenantId: number, key: string, value: string) {
    return systemSettingRepository.upsert(tenantId, key, value);
  },

  async getAllIntegrations(tenantId: number) {
    return integrationRepository.findAll(tenantId);
  },

  async updateIntegrationStatus(tenantId: number, id: number, status: IntegrationStatus) {
    return integrationRepository.updateStatus(id, tenantId, status);
  },

  async updateIntegrationConfig(tenantId: number, id: number, config: Record<string, string>) {
    return integrationRepository.updateConfig(id, tenantId, config);
  },

  async getIntegrationByKey(tenantId: number, serviceKey: string) {
    return integrationRepository.findByKey(serviceKey, tenantId);
  },

  async upsertIntegrationByKey(
    tenantId: number,
    serviceKey: string,
    data: { status?: IntegrationStatus; config?: Record<string, string> },
  ) {
    return integrationRepository.upsertByKey(tenantId, serviceKey, data);
  },
};
