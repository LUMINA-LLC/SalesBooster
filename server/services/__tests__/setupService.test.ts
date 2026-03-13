import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupService } from '../setupService';
import { tenantRepository } from '../../repositories/tenantRepository';

vi.mock('../../repositories/tenantRepository');

const mockedRepo = vi.mocked(tenantRepository);

describe('setupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetupStatus', () => {
    it('セットアップ完了状態を返す', async () => {
      mockedRepo.findSetupStatus.mockResolvedValue({ setupCompleted: true } as never);

      const result = await setupService.getSetupStatus(1);

      expect(mockedRepo.findSetupStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual({ setupCompleted: true });
    });

    it('セットアップ未完了状態を返す', async () => {
      mockedRepo.findSetupStatus.mockResolvedValue({ setupCompleted: false } as never);

      const result = await setupService.getSetupStatus(1);

      expect(result).toEqual({ setupCompleted: false });
    });

    it('テナントが見つからない場合nullを返す', async () => {
      mockedRepo.findSetupStatus.mockResolvedValue(null as never);

      const result = await setupService.getSetupStatus(999);

      expect(result).toBeNull();
    });
  });

  describe('updateSetupCompleted', () => {
    it('セットアップ完了状態を更新する', async () => {
      mockedRepo.updateSetupCompleted.mockResolvedValue(undefined as never);

      const result = await setupService.updateSetupCompleted(1, true);

      expect(mockedRepo.updateSetupCompleted).toHaveBeenCalledWith(1, true);
      expect(result).toEqual({ setupCompleted: true });
    });

    it('セットアップ未完了に戻す', async () => {
      mockedRepo.updateSetupCompleted.mockResolvedValue(undefined as never);

      const result = await setupService.updateSetupCompleted(1, false);

      expect(mockedRepo.updateSetupCompleted).toHaveBeenCalledWith(1, false);
      expect(result).toEqual({ setupCompleted: false });
    });
  });
});
