import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { departmentRepository } from '../departmentRepository';

describe('departmentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで全部署を取得する', async () => {
      const mockDepts = [
        { id: 1, name: '営業部', tenantId },
        { id: 2, name: '開発部', tenantId },
      ];
      prismaMock.department.findMany.mockResolvedValue(mockDepts);

      const result = await departmentRepository.findAll(tenantId);

      expect(prismaMock.department.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual(mockDepts);
    });
  });
});
