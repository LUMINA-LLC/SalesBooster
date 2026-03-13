import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../../__mocks__/prisma';
import { auditLogRepository } from '../auditLogRepository';

describe('auditLogRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 1;

  describe('findAll', () => {
    it('テナントIDで監査ログを取得する', async () => {
      const mockLogs = [{ id: 1, tenantId, action: 'LOGIN', user: { name: 'User1', email: 'u@test.com' } }];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await auditLogRepository.findAll(tenantId);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: undefined,
        take: undefined,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      });
      expect(result).toEqual(mockLogs);
    });

    it('ページネーションと日付フィルタ付きで取得する', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      prismaMock.auditLog.findMany.mockResolvedValue([]);

      await auditLogRepository.findAll(tenantId, { skip: 0, take: 10, startDate, endDate });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      });
    });
  });

  describe('count', () => {
    it('テナントIDで監査ログ数をカウントする', async () => {
      prismaMock.auditLog.count.mockResolvedValue(5);

      const result = await auditLogRepository.count(tenantId);

      expect(prismaMock.auditLog.count).toHaveBeenCalledWith({ where: { tenantId } });
      expect(result).toBe(5);
    });

    it('日付フィルタ付きでカウントする', async () => {
      const startDate = new Date('2025-01-01');
      prismaMock.auditLog.count.mockResolvedValue(3);

      const result = await auditLogRepository.count(tenantId, { startDate });

      expect(prismaMock.auditLog.count).toHaveBeenCalledWith({
        where: { tenantId, createdAt: { gte: startDate } },
      });
      expect(result).toBe(3);
    });
  });

  describe('create', () => {
    it('監査ログを作成する', async () => {
      const data = { userId: 'user1', action: 'LOGIN' as const, tenantId, detail: 'ログイン' };
      const mockCreated = { id: 1, ...data, createdAt: new Date() };
      prismaMock.auditLog.create.mockResolvedValue(mockCreated);

      const result = await auditLogRepository.create(data);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCreated);
    });
  });
});
