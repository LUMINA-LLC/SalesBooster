import { AuditAction } from '@prisma/client';
import { NextRequest } from 'next/server';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { getUserId } from '../lib/auth';

export const auditLogService = {
  async getAll(
    tenantId: number,
    page: number = 1,
    pageSize: number = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const skip = (page - 1) * pageSize;
    const [logs, total] = await Promise.all([
      auditLogRepository.findAll(tenantId, {
        skip,
        take: pageSize,
        startDate,
        endDate,
      }),
      auditLogRepository.count(tenantId, { startDate, endDate }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        date: log.createdAt.toISOString(),
        user: log.user?.name || '不明',
        action: log.action,
        detail: log.detail || '',
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async create(
    tenantId: number,
    data: { request: NextRequest; action: AuditAction; detail?: string },
  ) {
    const userId = await getUserId(data.request);
    return auditLogRepository.create({
      tenantId,
      userId,
      action: data.action,
      detail: data.detail,
    });
  },

  /** テナントIDを明示的に指定して監査ログを作成（SUPER_ADMIN用） */
  async createWithTenantId(
    request: NextRequest,
    tenantId: number,
    action: AuditAction,
    detail?: string,
  ) {
    const userId = await getUserId(request);
    return auditLogRepository.create({ tenantId, userId, action, detail });
  },
};
