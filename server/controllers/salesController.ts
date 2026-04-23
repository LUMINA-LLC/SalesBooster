import { NextRequest } from 'next/server';
import { salesService } from '../services/salesService';
import { groupService } from '../services/groupService';
import { auditLogService } from '../services/auditLogService';
import { lineNotificationService } from '../services/lineNotificationService';
import { googleChatNotificationService } from '../services/googleChatNotificationService';
import { memberRepository } from '../repositories/memberRepository';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';
import {
  endOfCurrentMonth,
  parseTrailingTwelveMonthsRange,
} from '../lib/dateUtils';

/**
 * グループフィルタ時は、指定期間内に所属していたメンバーのユニオンを返す。
 * startDate/endDateが渡されない場合は現在所属中のメンバーを返す。
 */
async function resolveUserIds(
  tenantId: number,
  searchParams: URLSearchParams,
  startDate?: Date,
  endDate?: Date,
): Promise<string[] | undefined> {
  const memberId = searchParams.get('memberId');
  const groupId = searchParams.get('groupId');

  if (memberId) {
    return [memberId];
  }

  if (groupId) {
    const gid = Number(groupId);

    if (startDate && endDate) {
      // 期間全体で1回のクエリで所属メンバーを一括取得
      const ids = await groupService.getMemberIdsByDateRange(
        tenantId,
        gid,
        startDate,
        endDate,
      );
      return ids.length > 0 ? ids : [];
    }

    // 期間未指定の場合は現在所属中のメンバー
    const ids = await groupService.getCurrentMemberIds(tenantId, gid);
    return ids.length > 0 ? ids : [];
  }

  return undefined;
}

function resolveDataTypeId(searchParams: URLSearchParams): number | undefined {
  const dataTypeId = searchParams.get('dataTypeId');
  return dataTypeId ? Number(dataTypeId) : undefined;
}

function resolveAggregateField(
  searchParams: URLSearchParams,
): string | undefined {
  const v = searchParams.get('aggregateField');
  return v && v !== 'value' ? v : undefined;
}

export const salesController = {
  async getSalesByPeriod(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : endOfCurrentMonth(now);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const dataTypeId = resolveDataTypeId(searchParams);
      const aggregateField = resolveAggregateField(searchParams);
      const { salesPeople, recordCount } =
        await salesService.getSalesByDateRange(
          tenantId,
          startDate,
          endDate,
          userIds,
          dataTypeId,
          aggregateField,
        );
      return ApiResponse.success({ data: salesPeople, recordCount });
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      return ApiResponse.serverError();
    }
  },

  async createSalesRecord(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const {
        memberId,
        value,
        description,
        recordDate,
        customFields,
        dataTypeId,
      } = body;

      if (!memberId || !recordDate) {
        return ApiResponse.badRequest('memberId, recordDate are required');
      }

      const userId = String(memberId);
      const numValue = value !== undefined ? Number(value) : 0;

      const record = await salesService.createSalesRecord(tenantId, {
        userId,
        value: numValue,
        description,
        recordDate: new Date(recordDate),
        ...(customFields ? { customFields } : {}),
        ...(dataTypeId ? { dataTypeId: Number(dataTypeId) } : {}),
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_CREATE',
          detail: `ユーザーID:${userId}のデータを記録（値:${numValue}）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      memberRepository
        .findById(userId, tenantId)
        .then((user) => {
          if (user) {
            const notificationData = {
              memberName: user.name || '',
              value: numValue,
              recordDate: new Date(recordDate),
            };
            lineNotificationService
              .sendSalesNotification(tenantId, notificationData)
              .catch((err) => console.error('LINE notification failed:', err));
            googleChatNotificationService
              .sendSalesNotification(tenantId, notificationData)
              .catch((err) =>
                console.error('Google Chat notification failed:', err),
              );
          }
        })
        .catch((err) => console.error('Notification failed:', err));

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
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), 0, 1);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : endOfCurrentMonth(now);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const dataTypeId = resolveDataTypeId(searchParams);
      const aggregateField = resolveAggregateField(searchParams);
      const data = await salesService.getCumulativeSales(
        tenantId,
        startDate,
        endDate,
        userIds,
        dataTypeId,
        aggregateField,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch cumulative sales data:', error);
      return ApiResponse.serverError();
    }
  },

  async getReportData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = parseTrailingTwelveMonthsRange(searchParams);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const dataTypeId = resolveDataTypeId(searchParams);
      const data = await salesService.getReportData(
        tenantId,
        startDate,
        endDate,
        userIds,
        dataTypeId,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      return ApiResponse.serverError();
    }
  },

  async getTrendData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = parseTrailingTwelveMonthsRange(searchParams);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const dataTypeId = resolveDataTypeId(searchParams);
      const aggregateField = resolveAggregateField(searchParams);
      const data = await salesService.getTrendData(
        tenantId,
        startDate,
        endDate,
        userIds,
        dataTypeId,
        aggregateField,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      return ApiResponse.serverError();
    }
  },

  async getRankingBoardData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const endDate = endOfCurrentMonth(now);
    const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const dataTypeId = resolveDataTypeId(searchParams);
      const aggregateField = resolveAggregateField(searchParams);
      const data = await salesService.getRankingBoardData(
        tenantId,
        startDate,
        endDate,
        userIds,
        dataTypeId,
        aggregateField,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch ranking board data:', error);
      return ApiResponse.serverError();
    }
  },

  async getPreviousPeriodAverages(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : endOfCurrentMonth(now);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const dataTypeId = resolveDataTypeId(searchParams);

      // 逐次実行でDB接続プール枯渇を防止
      const prevMonthAvg = await salesService.getPreviousPeriodAverage(
        tenantId,
        startDate,
        endDate,
        'prev_month',
        userIds,
        dataTypeId,
      );
      const prevYearAvg = await salesService.getPreviousPeriodAverage(
        tenantId,
        startDate,
        endDate,
        'prev_year',
        userIds,
        dataTypeId,
      );

      return ApiResponse.success({ prevMonthAvg, prevYearAvg });
    } catch (error) {
      console.error('Failed to fetch previous period averages:', error);
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

    const filters: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      userIds?: string[];
      dataTypeId?: number;
    } = {};
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(`${endDateParam}T23:59:59`);
    if (memberIdParam) {
      filters.userId = memberIdParam;
    } else if (groupIdParam) {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        filters.startDate,
        filters.endDate,
      );
      if (userIds) filters.userIds = userIds;
    }
    const dataTypeId = resolveDataTypeId(searchParams);
    if (dataTypeId) filters.dataTypeId = dataTypeId;

    try {
      const data = await salesService.getSalesRecords(
        tenantId,
        page,
        pageSize,
        filters,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch sales records:', error);
      return ApiResponse.serverError();
    }
  },

  async updateSalesRecord(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const {
        memberId,
        value,
        description,
        recordDate,
        customFields,
        dataTypeId,
      } = body;

      if (!memberId || !recordDate) {
        return ApiResponse.badRequest('memberId, recordDate are required');
      }

      const updated = await salesService.updateSalesRecord(tenantId, id, {
        userId: String(memberId),
        value: value !== undefined ? Number(value) : undefined,
        description: description || undefined,
        recordDate: new Date(recordDate),
        ...(customFields !== undefined ? { customFields } : {}),
        ...(dataTypeId !== undefined ? { dataTypeId: Number(dataTypeId) } : {}),
      });

      if (!updated) {
        return ApiResponse.notFound('レコードが見つかりません');
      }

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_UPDATE',
          detail: `レコードID:${id}を更新（ユーザーID:${memberId}）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(updated);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update sales record');
    }
  },

  async importSalesRecords(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { records } = body;

      if (!Array.isArray(records) || records.length === 0) {
        return ApiResponse.badRequest('records array is required');
      }

      const results = await salesService.importSalesRecords(tenantId, records);

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_CREATE',
          detail: `データ一括インポート: ${results.created}件追加`,
        })
        .catch((err) => console.error('Audit log failed:', err));

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

    const filters: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      userIds?: string[];
      dataTypeId?: number;
    } = {};
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(`${endDateParam}T23:59:59`);
    if (memberIdParam) {
      filters.userId = memberIdParam;
    } else if (groupIdParam) {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        filters.startDate,
        filters.endDate,
      );
      if (userIds) filters.userIds = userIds;
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

  /** 速報検出用: 今月のレコード総数 + 最新N件を返す */
  async getBreakingNewsData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endOfCurrentMonth(now);

    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const data = await salesService.getBreakingNewsData(
        tenantId,
        startDate,
        endDate,
        limit,
        userIds,
      );
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch breaking news data:', error);
      return ApiResponse.serverError();
    }
  },

  async deleteSalesRecord(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const deleted = await salesService.deleteSalesRecord(tenantId, id);

      if (!deleted) {
        return ApiResponse.notFound('レコードが見つかりません');
      }

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_DELETE',
          detail: `レコードID:${id}を削除（ユーザー:${deleted.user.name}）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ message: '削除しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete sales record');
    }
  },
};
