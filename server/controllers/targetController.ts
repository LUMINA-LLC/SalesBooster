import { NextRequest } from 'next/server';
import { targetService } from '../services/targetService';
import { auditLogService } from '../services/auditLogService';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const targetController = {
  async getAll(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const data = await targetService.getAll(tenantId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch targets:', error);
      return ApiResponse.serverError();
    }
  },

  async upsert(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { memberId, value, year, month, dataTypeId } = body;

      if (!memberId || value === undefined || !year || !month) {
        return ApiResponse.badRequest(
          'memberId, value, year, month are required',
        );
      }

      const userId = String(memberId);
      const target = await targetService.upsert(tenantId, {
        userId,
        value: Number(value),
        year: Number(year),
        month: Number(month),
        ...(dataTypeId ? { dataTypeId: Number(dataTypeId) } : {}),
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'TARGET_UPSERT',
          detail: `ユーザーID:${userId}の${year}/${month}月目標を設定`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(target);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to upsert target');
    }
  },

  async getByYear(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const year = Number(searchParams.get('year') || new Date().getFullYear());
      const dataTypeId = searchParams.get('dataTypeId')
        ? Number(searchParams.get('dataTypeId'))
        : undefined;

      const data = await targetService.getByYear(tenantId, year, dataTypeId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch targets by year:', error);
      return ApiResponse.serverError();
    }
  },

  async bulkUpsert(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { targets, year, dataTypeId } = body;

      if (!targets || !Array.isArray(targets) || !year) {
        return ApiResponse.badRequest('targets array and year are required');
      }

      const data = targets.map(
        (t: { userId: string; month: number; value: number }) => ({
          userId: String(t.userId),
          value: Number(t.value),
          year: Number(year),
          month: Number(t.month),
          ...(dataTypeId ? { dataTypeId: Number(dataTypeId) } : {}),
        }),
      );

      await targetService.bulkUpsert(tenantId, data);

      auditLogService
        .create(tenantId, {
          request,
          action: 'TARGET_BULK_UPSERT',
          detail: `${year}年の目標を一括設定（${data.length}件）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ updated: data.length });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to bulk upsert targets');
    }
  },

  async getGroupTargetsByYear(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const year = Number(searchParams.get('year') || new Date().getFullYear());
      const dataTypeId = searchParams.get('dataTypeId')
        ? Number(searchParams.get('dataTypeId'))
        : undefined;

      const data = await targetService.getGroupTargetsByYear(
        tenantId,
        year,
        dataTypeId,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch group targets:', error);
      return ApiResponse.serverError();
    }
  },

  async bulkUpsertGroupTargets(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { targets, year, dataTypeId } = body;

      if (!targets || !Array.isArray(targets) || !year) {
        return ApiResponse.badRequest('targets array and year are required');
      }

      const data = targets.map(
        (t: { groupId: number; month: number; value: number }) => ({
          groupId: Number(t.groupId),
          value: Number(t.value),
          year: Number(year),
          month: Number(t.month),
          ...(dataTypeId ? { dataTypeId: Number(dataTypeId) } : {}),
        }),
      );

      await targetService.bulkUpsertGroupTargets(tenantId, data);

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_TARGET_UPSERT',
          detail: `${year}年のグループ目標を一括設定（${data.length}件）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ updated: data.length });
    } catch (error) {
      return ApiResponse.fromError(
        error,
        'Failed to bulk upsert group targets',
      );
    }
  },
};
