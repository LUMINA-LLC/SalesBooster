import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditLogService } from '../auditLogService';
import { auditLogRepository } from '../../repositories/auditLogRepository';
import { getUserId } from '../../lib/auth';
import { AuditAction } from '@prisma/client';
import { NextRequest } from 'next/server';

vi.mock('../../repositories/auditLogRepository');
vi.mock('../../lib/auth');

const mockedRepo = vi.mocked(auditLogRepository);
const mockedGetUserId = vi.mocked(getUserId);

describe('auditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('ページネーション付きでログを取得し、フォーマットして返す', async () => {
      const mockLogs = [
        {
          id: 1,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          user: { name: 'テストユーザー' },
          action: 'LOGIN' as AuditAction,
          detail: '詳細テキスト',
        },
        {
          id: 2,
          createdAt: new Date('2024-01-02T00:00:00Z'),
          user: null,
          action: 'LOGOUT' as AuditAction,
          detail: null,
        },
      ];
      mockedRepo.findAll.mockResolvedValue(mockLogs as never);
      mockedRepo.count.mockResolvedValue(25);

      const result = await auditLogService.getAll(1, 2, 10);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1, {
        skip: 10,
        take: 10,
        startDate: undefined,
        endDate: undefined,
      });
      expect(mockedRepo.count).toHaveBeenCalledWith(1, {
        startDate: undefined,
        endDate: undefined,
      });
      expect(result.logs).toHaveLength(2);
      expect(result.logs[0]).toEqual({
        id: 1,
        date: '2024-01-01T00:00:00.000Z',
        user: 'テストユーザー',
        action: 'LOGIN',
        detail: '詳細テキスト',
      });
      expect(result.logs[1].user).toBe('不明');
      expect(result.logs[1].detail).toBe('');
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    it('デフォルトのページ・ページサイズが適用される', async () => {
      mockedRepo.findAll.mockResolvedValue([]);
      mockedRepo.count.mockResolvedValue(0);

      await auditLogService.getAll(1);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1, {
        skip: 0,
        take: 10,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('日付フィルターを渡せる', async () => {
      mockedRepo.findAll.mockResolvedValue([]);
      mockedRepo.count.mockResolvedValue(0);

      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      await auditLogService.getAll(1, 1, 10, start, end);

      expect(mockedRepo.findAll).toHaveBeenCalledWith(1, {
        skip: 0,
        take: 10,
        startDate: start,
        endDate: end,
      });
    });
  });

  describe('create', () => {
    it('getUserIdを呼んでからリポジトリのcreateを呼ぶ', async () => {
      const mockRequest = {} as NextRequest;
      mockedGetUserId.mockResolvedValue('user-123');
      mockedRepo.create.mockResolvedValue({ id: 1 } as never);

      await auditLogService.create(1, {
        request: mockRequest,
        action: 'LOGIN' as AuditAction,
        detail: 'テスト',
      });

      expect(mockedGetUserId).toHaveBeenCalledWith(mockRequest);
      expect(mockedRepo.create).toHaveBeenCalledWith({
        tenantId: 1,
        userId: 'user-123',
        action: 'LOGIN',
        detail: 'テスト',
      });
    });
  });

  describe('createWithTenantId', () => {
    it('テナントIDを指定してログを作成する', async () => {
      const mockRequest = {} as NextRequest;
      mockedGetUserId.mockResolvedValue('admin-1');
      mockedRepo.create.mockResolvedValue({ id: 2 } as never);

      await auditLogService.createWithTenantId(
        mockRequest,
        5,
        'SETTINGS_UPDATE' as AuditAction,
        '設定変更',
      );

      expect(mockedGetUserId).toHaveBeenCalledWith(mockRequest);
      expect(mockedRepo.create).toHaveBeenCalledWith({
        tenantId: 5,
        userId: 'admin-1',
        action: 'SETTINGS_UPDATE',
        detail: '設定変更',
      });
    });
  });
});
