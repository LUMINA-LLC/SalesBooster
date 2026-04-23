import { NextRequest } from 'next/server';
import { customFieldService } from '../services/customFieldService';
import { auditLogService } from '../services/auditLogService';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const customFieldController = {
  async getCustomFields(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const activeOnly = searchParams.get('active') === 'true';
      const aggregatableOnly = searchParams.get('aggregatable') === 'true';
      const dataTypeIdParam = searchParams.get('dataTypeId');
      const dataTypeId = dataTypeIdParam ? Number(dataTypeIdParam) : undefined;

      if (aggregatableOnly) {
        if (!dataTypeId) {
          return ApiResponse.badRequest(
            'dataTypeId is required when aggregatable=true',
          );
        }
        const fields = await customFieldService.getAggregatable(
          tenantId,
          dataTypeId,
        );
        return ApiResponse.success(fields);
      }

      const fields = activeOnly
        ? await customFieldService.getActive(tenantId, dataTypeId)
        : await customFieldService.getAll(tenantId, dataTypeId);

      return ApiResponse.success(fields);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch custom fields');
    }
  },

  async createCustomField(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const {
        name,
        fieldType,
        options,
        isRequired,
        aggregatable,
        unit,
        dataTypeId,
      } = body;

      if (!name || !fieldType || !dataTypeId) {
        return ApiResponse.badRequest(
          'name, fieldType, dataTypeId are required',
        );
      }

      if (!['TEXT', 'DATE', 'SELECT', 'NUMBER'].includes(fieldType)) {
        return ApiResponse.badRequest(
          'fieldType must be TEXT, DATE, SELECT, or NUMBER',
        );
      }

      if (
        fieldType === 'SELECT' &&
        (!Array.isArray(options) || options.length === 0)
      ) {
        return ApiResponse.badRequest('SELECT type requires options array');
      }

      const field = await customFieldService.create(tenantId, {
        name,
        fieldType,
        dataTypeId: Number(dataTypeId),
        options: fieldType === 'SELECT' ? options : undefined,
        isRequired: isRequired ?? false,
        aggregatable: fieldType === 'NUMBER' ? !!aggregatable : false,
        unit: fieldType === 'NUMBER' && aggregatable ? unit : undefined,
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'CUSTOM_FIELD_CREATE',
          detail: `カスタムフィールド「${name}」(${fieldType})を追加`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(field);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to create custom field');
    }
  },

  async updateCustomField(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const {
        name,
        fieldType,
        options,
        isRequired,
        aggregatable,
        unit,
        sortOrder,
        isActive,
      } = body;

      if (fieldType && !['TEXT', 'DATE', 'SELECT', 'NUMBER'].includes(fieldType)) {
        return ApiResponse.badRequest(
          'fieldType must be TEXT, DATE, SELECT, or NUMBER',
        );
      }

      if (
        fieldType === 'SELECT' &&
        options !== undefined &&
        (!Array.isArray(options) || options.length === 0)
      ) {
        return ApiResponse.badRequest('SELECT type requires options array');
      }

      const updated = await customFieldService.update(tenantId, id, {
        name,
        fieldType,
        options:
          fieldType === 'SELECT' ? options : fieldType ? undefined : undefined,
        isRequired,
        aggregatable,
        unit,
        sortOrder,
        isActive,
      });

      if (!updated) {
        return ApiResponse.notFound('カスタムフィールドが見つかりません');
      }

      auditLogService
        .create(tenantId, {
          request,
          action: 'CUSTOM_FIELD_UPDATE',
          detail: `カスタムフィールドID:${id}を更新`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(updated);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update custom field');
    }
  },

  async deleteCustomField(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const result = await customFieldService.softDelete(tenantId, id);

      if (!result || result.count === 0) {
        return ApiResponse.notFound('カスタムフィールドが見つかりません');
      }

      auditLogService
        .create(tenantId, {
          request,
          action: 'CUSTOM_FIELD_DELETE',
          detail: `カスタムフィールドID:${id}を無効化`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ message: '削除しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete custom field');
    }
  },
};
