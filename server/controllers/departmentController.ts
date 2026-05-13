import { NextRequest } from 'next/server';
import { departmentService } from '../services/departmentService';
import { getTenantId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';
import { logger } from '@/lib/logger';

export const departmentController = {
  async getAll(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const data = await departmentService.getAll(tenantId);
      return ApiResponse.success(data);
    } catch (error) {
      logger.error('Failed to fetch departments', error);
      return ApiResponse.serverError();
    }
  },
};
