import { NextRequest } from 'next/server';
import { salesService } from '../services/salesService';
import { groupService } from '../services/groupService';
import { auditLogService } from '../services/auditLogService';
import { lineNotificationService } from '../services/lineNotificationService';
import { googleChatNotificationService } from '../services/googleChatNotificationService';
import { memberRepository } from '../repositories/memberRepository';
import { getTenantId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

async function resolveMemberIds(tenantId: number, searchParams: URLSearchParams): Promise<number[] | undefined> {
  const memberId = searchParams.get('memberId');
  const groupId = searchParams.get('groupId');

  if (memberId) {
    return [Number(memberId)];
  }

  if (groupId) {
    const group = await groupService.getById(tenantId, Number(groupId));
    if (group) {
      return group.members.map((gm) => gm.memberId);
    }
    return [];
  }

  return undefined;
}

function resolveDataTypeId(searchParams: URLSearchParams): number | undefined {
  const dataTypeId = searchParams.get('dataTypeId');
  return dataTypeId ? Number(dataTypeId) : undefined;
}

export const salesController = {
  async getSalesByPeriod(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // startDate/endDateが指定されていない場合は当月をデフォルトにする
    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    try {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      const dataTypeId = resolveDataTypeId(searchParams);
      const { salesPeople, recordCount } = await salesService.getSalesByDateRange(tenantId, startDate, endDate, memberIds, dataTypeId);
      return ApiResponse.success({ data: salesPeople, recordCount });
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      return ApiResponse.serverError();
    }
  },

  async createSalesRecord(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { memberId, value, description, recordDate, customFields, dataTypeId } = body;

      if (!memberId || !recordDate) {
        return ApiResponse.badRequest('memberId, recordDate are required');
      }

      const numMemberId = Number(memberId);
      const numValue = value !== undefined ? Number(value) : 0;

      const record = await salesService.createSalesRecord(tenantId, {
        memberId: numMemberId,
        value: numValue,
        description,
        recordDate: new Date(recordDate),
        ...(customFields ? { customFields } : {}),
        ...(dataTypeId ? { dataTypeId: Number(dataTypeId) } : {}),
      });

      auditLogService.create(tenantId, {
        request,
        action: 'SALES_RECORD_CREATE',
        detail: `メンバーID:${numMemberId}のデータを記録（値:${numValue}）`,
      }).catch((err) => console.error('Audit log failed:', err));

      memberRepository.findById(numMemberId, tenantId).then((member) => {
        if (member) {
          const notificationData = {
            memberName: member.name,
            value: numValue,
            recordDate: new Date(recordDate),
          };
          lineNotificationService.sendSalesNotification(tenantId, notificationData)
            .catch((err) => console.error('LINE notification failed:', err));
          googleChatNotificationService.sendSalesNotification(tenantId, notificationData)
            .catch((err) => console.error('Google Chat notification failed:', err));
        }
      }).catch((err) => console.error('Notification failed:', err));

      return ApiResponse.created(record);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to create sales record');
    }
  },

  async getDateRange(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const dateRange = await salesService.getDateRange(tenantId);
      return ApiResponse.success(dateRange);
    } catch (error) {
      console.error('Failed to fetch date range:', error);
      return ApiResponse.serverError();
    }
  },

  async getCumulativeSales(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), 0, 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    try {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      const dataTypeId = resolveDataTypeId(searchParams);
      const data = await salesService.getCumulativeSales(tenantId, startDate, endDate, memberIds, dataTypeId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch cumulative sales data:', error);
      return ApiResponse.serverError();
    }
  },

  async getReportData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    try {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      const dataTypeId = resolveDataTypeId(searchParams);
      const data = await salesService.getReportData(tenantId, startDate, endDate, memberIds, dataTypeId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      return ApiResponse.serverError();
    }
  },

  async getTrendData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    try {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      const dataTypeId = resolveDataTypeId(searchParams);
      const data = await salesService.getTrendData(tenantId, startDate, endDate, memberIds, dataTypeId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      return ApiResponse.serverError();
    }
  },

  async getRankingBoardData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);

    // 直近3ヶ月固定（期間パラメータは無視）
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    try {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      const dataTypeId = resolveDataTypeId(searchParams);
      const data = await salesService.getRankingBoardData(tenantId, startDate, endDate, memberIds, dataTypeId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch ranking board data:', error);
      return ApiResponse.serverError();
    }
  },

  async getSalesRecords(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const memberIdParam = searchParams.get('memberId');
    const groupIdParam = searchParams.get('groupId');

    const filters: { startDate?: Date; endDate?: Date; memberId?: number; memberIds?: number[]; dataTypeId?: number } = {};
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(`${endDateParam}T23:59:59`);
    if (memberIdParam) {
      filters.memberId = Number(memberIdParam);
    } else if (groupIdParam) {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      if (memberIds) filters.memberIds = memberIds;
    }
    const dataTypeId = resolveDataTypeId(searchParams);
    if (dataTypeId) filters.dataTypeId = dataTypeId;

    try {
      const data = await salesService.getSalesRecords(tenantId, page, pageSize, filters);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch sales records:', error);
      return ApiResponse.serverError();
    }
  },

  async updateSalesRecord(request: NextRequest, id: number) {
    try {
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { memberId, value, description, recordDate, customFields, dataTypeId } = body;

      if (!memberId || !recordDate) {
        return ApiResponse.badRequest('memberId, recordDate are required');
      }

      const updated = await salesService.updateSalesRecord(tenantId, id, {
        memberId: Number(memberId),
        value: value !== undefined ? Number(value) : undefined,
        description: description || undefined,
        recordDate: new Date(recordDate),
        ...(customFields !== undefined ? { customFields } : {}),
        ...(dataTypeId !== undefined ? { dataTypeId: Number(dataTypeId) } : {}),
      });

      if (!updated) {
        return ApiResponse.notFound('レコードが見つかりません');
      }

      auditLogService.create(tenantId, {
        request,
        action: 'SALES_RECORD_UPDATE',
        detail: `レコードID:${id}を更新（メンバーID:${memberId}）`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(updated);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update sales record');
    }
  },

  async importSalesRecords(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { records } = body;

      if (!Array.isArray(records) || records.length === 0) {
        return ApiResponse.badRequest('records array is required');
      }

      const results = await salesService.importSalesRecords(tenantId, records);

      auditLogService.create(tenantId, {
        request,
        action: 'SALES_RECORD_CREATE',
        detail: `データ一括インポート: ${results.created}件追加`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(results);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to import sales records');
    }
  },

  async exportSalesRecords(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const memberIdParam = searchParams.get('memberId');
    const groupIdParam = searchParams.get('groupId');

    const filters: { startDate?: Date; endDate?: Date; memberId?: number; memberIds?: number[]; dataTypeId?: number } = {};
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(`${endDateParam}T23:59:59`);
    if (memberIdParam) {
      filters.memberId = Number(memberIdParam);
    } else if (groupIdParam) {
      const memberIds = await resolveMemberIds(tenantId, searchParams);
      if (memberIds) filters.memberIds = memberIds;
    }
    const dataTypeId = resolveDataTypeId(searchParams);
    if (dataTypeId) filters.dataTypeId = dataTypeId;

    try {
      const data = await salesService.getAllSalesRecords(tenantId, filters);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to export sales records:', error);
      return ApiResponse.serverError();
    }
  },

  async deleteSalesRecord(request: NextRequest, id: number) {
    try {
      const tenantId = await getTenantId(request);
      const deleted = await salesService.deleteSalesRecord(tenantId, id);

      if (!deleted) {
        return ApiResponse.notFound('レコードが見つかりません');
      }

      auditLogService.create(tenantId, {
        request,
        action: 'SALES_RECORD_DELETE',
        detail: `レコードID:${id}を削除（メンバー:${deleted.member.name}）`,
      }).catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ message: '削除しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete sales record');
    }
  },
};
