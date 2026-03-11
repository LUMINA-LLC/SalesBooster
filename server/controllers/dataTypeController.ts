import { NextRequest } from 'next/server';
import { dataTypeService } from '../services/dataTypeService';
import { auditLogService } from '../services/auditLogService';
import { getTenantId, requireAdmin, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const dataTypeController = {
  async getAll(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const activeOnly = searchParams.get('active') === 'true';

      const data = activeOnly
        ? await dataTypeService.getActive(tenantId)
        : await dataTypeService.getAll(tenantId);

      return ApiResponse.success(data);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch data types');
    }
  },

  async create(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      await requireAdmin(request);
      const body = await request.json();
      const { name, unit, color, sortOrder } = body;

      if (!name) {
        return ApiResponse.badRequest('name is required');
      }

      const dataType = await dataTypeService.create(tenantId, {
        name,
        unit: unit || '',
        color: color || undefined,
        sortOrder: sortOrder ?? 0,
      });

      auditLogService.create(tenantId, {
        request,
        action: 'DATA_TYPE_CREATE',
        detail: `データ種類「${name}」を追加`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(dataType);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to create data type');
    }
  },

  async update(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      await requireAdmin(request);
      const body = await request.json();
      const { name, unit, color, sortOrder, isActive } = body;

      const updated = await dataTypeService.update(tenantId, id, {
        ...(name !== undefined ? { name } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      });

      if (!updated) {
        return ApiResponse.notFound('データ種類が見つかりません');
      }

      auditLogService.create(tenantId, {
        request,
        action: 'DATA_TYPE_UPDATE',
        detail: `データ種類ID:${id}を更新`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(updated);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update data type');
    }
  },

  async delete(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      await requireAdmin(request);

      const deleted = await dataTypeService.delete(tenantId, id);
      if (!deleted) {
        return ApiResponse.notFound('データ種類が見つかりません');
      }

      auditLogService.create(tenantId, {
        request,
        action: 'DATA_TYPE_DELETE',
        detail: `データ種類「${deleted.name}」を削除`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ message: '削除しました' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('デフォルト')) {
        return ApiResponse.badRequest(error.message);
      }
      return ApiResponse.fromError(error, 'Failed to delete data type');
    }
  },

  async updateSortOrders(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      await requireAdmin(request);
      const body = await request.json();
      const { items } = body;

      if (!Array.isArray(items)) {
        return ApiResponse.badRequest('items array is required');
      }

      await dataTypeService.updateSortOrders(tenantId, items);
      return ApiResponse.success({ message: '並び順を更新しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update sort orders');
    }
  },
};
