import { tenantRepository } from '../repositories/tenantRepository';

export const setupService = {
  async getSetupStatus(tenantId: number) {
    const status = await tenantRepository.findSetupStatus(tenantId);
    if (!status) {
      return null;
    }
    return { setupCompleted: status.setupCompleted };
  },

  async updateSetupCompleted(tenantId: number, completed: boolean) {
    await tenantRepository.updateSetupCompleted(tenantId, completed);
    return { setupCompleted: completed };
  },
};
