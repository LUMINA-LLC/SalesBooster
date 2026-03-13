import { NextRequest } from 'next/server';
import { auditLogService } from '../services/auditLogService';
import { getTenantId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const auditLogController = {
  async getAll(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam
      ? new Date(`${endDateParam}T23:59:59`)
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
      console.error('Failed to fetch audit logs:', error);
      return ApiResponse.serverError();
    }
  },
};
