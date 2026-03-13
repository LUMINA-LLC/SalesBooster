import { describe, it, expect, beforeEach, vi } from 'vitest';
import { departmentService } from '../departmentService';
import { departmentRepository } from '../../repositories/departmentRepository';

vi.mock('../../repositories/departmentRepository');

const mockedRepo = vi.mocked(departmentRepository);

describe('departmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('テナントの全部署を返す', async () => {
      const mockDepts = [
        { id: 1, name: '営業部' },
        { id: 2, name: '開発部' },
      ];
      mockedRepo.findAll.mockResolvedValue(mockDepts as never);

      const result = await departmentService.getAll(1);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDepts);
    });

    it('部署がない場合空配列を返す', async () => {
      mockedRepo.findAll.mockResolvedValue([]);

      const result = await departmentService.getAll(1);

      expect(result).toEqual([]);
    });
  });
});
