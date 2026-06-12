import { NextRequest } from 'next/server';
import { auditLogService } from '../services/auditLogService';
import { getTenantId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';
import { jstStartOfDay, jstEndOfDay } from '../lib/dateUtils';
import { logger } from '@/lib/logger';

export const auditLogController = {
  async getAll(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    // 日付境界は JST で統一（素の new Date は UTC 解釈でずれるため）
    const startDate = startDateParam
      ? (jstStartOfDay(startDateParam) ?? undefined)
      : undefined;
    const endDate = endDateParam
      ? (jstEndOfDay(endDateParam) ?? undefined)
      : undefined;

    try {
      const tenantId = await getTenantId(request);
      const data = await auditLogService.getAll(
        tenantId,
        page,
        pageSize,
        startDate,
        endDate,
      );
      return ApiResponse.success(data);
    } catch (error) {
      logger.error('Failed to fetch audit logs', error);
      return ApiResponse.serverError();
    }
  },
};
