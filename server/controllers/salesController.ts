import { NextRequest } from 'next/server';
import { salesService } from '../services/salesService';
import { auditLogService } from '../services/auditLogService';
import { tenantEventsBroadcastService } from '../services/tenantEventsBroadcastService';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';
import {
  parseTrailingTwelveJstMonthsRange,
  parseCurrentJstMonthRange,
  parseYearToCurrentJstRange,
  parseRecentThreeJstMonthsRange,
  parseReportSummaryRange,
  currentJstMonthRange,
  jstStartOfDay,
  jstEndOfDay,
} from '../lib/dateUtils';
import {
  resolveUserIds,
  resolveDataTypeId,
  resolveAggregateField,
  resolveAggregationUnit,
} from '../lib/queryParams';
import { logger } from '@/lib/logger';

export const salesController = {
  async getSalesByPeriod(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = parseCurrentJstMonthRange(searchParams);

    try {
      const aggregationUnit = resolveAggregationUnit(searchParams);
      // グループ単位は全グループ集計のため絞り込み（userIds）を無効化する
      const userIds =
        aggregationUnit === 'group'
          ? undefined
          : await resolveUserIds(tenantId, searchParams, startDate, endDate);
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
          aggregationUnit,
        );
      return ApiResponse.success({ data: salesPeople, recordCount });
    } catch (error) {
      logger.error('Failed to fetch sales data', error);
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
        notifyBreakingNews,
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
        ...(notifyBreakingNews !== undefined
          ? { notifyBreakingNews: !!notifyBreakingNews }
          : {}),
      });

      logger.info('Sales record created', {
        tenantId,
        recordId: record.id,
        userId,
        value: numValue,
        dataTypeId: dataTypeId ?? null,
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_CREATE',
          detail: `ユーザーID:${userId}のデータを記録（値:${numValue}）`,
        })
        .catch((err) => logger.error('Audit log failed', err));

      // レコード作成後の通知（速報 broadcast / データ変更 / LINE / Google Chat）は
      // HTTP 非依存のため service 層に集約している。
      salesService.notifyAfterRecordCreated(tenantId, {
        recordId: record.id,
        notifyBreakingNews: record.notifyBreakingNews,
        userId,
        value: numValue,
        recordDate: new Date(recordDate),
        customFields: customFields ?? null,
        ...(dataTypeId ? { dataTypeId: Number(dataTypeId) } : {}),
      });

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
      logger.error('Failed to fetch date range', error);
      return ApiResponse.serverError();
    }
  },

  async getCumulativeSales(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = parseYearToCurrentJstRange(searchParams);

    try {
      const aggregationUnit = resolveAggregationUnit(searchParams);
      const userIds =
        aggregationUnit === 'group'
          ? undefined
          : await resolveUserIds(tenantId, searchParams, startDate, endDate);
      const dataTypeId = resolveDataTypeId(searchParams);
      const aggregateField = resolveAggregateField(searchParams);
      const data = await salesService.getCumulativeSales(
        tenantId,
        startDate,
        endDate,
        userIds,
        dataTypeId,
        aggregateField,
        aggregationUnit,
      );
      return ApiResponse.success(data);
    } catch (error) {
      logger.error('Failed to fetch cumulative sales data', error);
      return ApiResponse.serverError();
    }
  },

  async getReportData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } =
      parseTrailingTwelveJstMonthsRange(searchParams);

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
      logger.error('Failed to fetch report data', error);
      return ApiResponse.serverError();
    }
  },

  async getReportSummary(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);

    try {
      // 基準月（未指定なら当月）と、フィルタ解決用の集計範囲（基準月の23ヶ月前〜基準月末）。
      const { baseDate, rangeStart, rangeEnd } =
        parseReportSummaryRange(searchParams);

      const aggregationUnit = resolveAggregationUnit(searchParams);
      const userIds =
        aggregationUnit === 'group'
          ? undefined
          : await resolveUserIds(tenantId, searchParams, rangeStart, rangeEnd);
      const data = await salesService.getReportSummary(
        tenantId,
        baseDate,
        userIds,
        aggregationUnit,
      );
      return ApiResponse.success(data);
    } catch (error) {
      logger.error('Failed to fetch report summary', error);
      return ApiResponse.serverError();
    }
  },

  async getTrendData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } =
      parseTrailingTwelveJstMonthsRange(searchParams);

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
      logger.error('Failed to fetch trend data', error);
      return ApiResponse.serverError();
    }
  },

  async getRankingBoardData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);

    // TOTAL集計用: クエリ指定があればその期間、なければ直近3ヶ月。
    const { startDate: totalStartDate, endDate: totalEndDate } =
      parseRecentThreeJstMonthsRange(searchParams);

    try {
      const aggregationUnit = resolveAggregationUnit(searchParams);
      const userIds =
        aggregationUnit === 'group'
          ? undefined
          : await resolveUserIds(
              tenantId,
              searchParams,
              totalStartDate,
              totalEndDate,
            );
      const dataTypeId = resolveDataTypeId(searchParams);
      const aggregateField = resolveAggregateField(searchParams);
      const data = await salesService.getRankingBoardData(
        tenantId,
        totalStartDate,
        totalEndDate,
        userIds,
        dataTypeId,
        aggregateField,
        aggregationUnit,
      );
      return ApiResponse.success(data);
    } catch (error) {
      logger.error('Failed to fetch ranking board data', error);
      return ApiResponse.serverError();
    }
  },

  async getPreviousPeriodAverages(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = parseCurrentJstMonthRange(searchParams);

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
      logger.error('Failed to fetch previous period averages', error);
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
    if (startDateParam) {
      const d = jstStartOfDay(startDateParam);
      if (d) filters.startDate = d;
    }
    if (endDateParam) {
      const d = jstEndOfDay(endDateParam);
      if (d) filters.endDate = d;
    }
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
      logger.error('Failed to fetch sales records', error);
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

      logger.info('Sales record updated', {
        tenantId,
        recordId: id,
        userId: String(memberId),
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_UPDATE',
          detail: `レコードID:${id}を更新（ユーザーID:${memberId}）`,
        })
        .catch((err) => logger.error('Audit log failed', err));

      // 売上データの変更通知（ディスプレイデータ更新用）
      tenantEventsBroadcastService
        .notifyDataChanged(tenantId)
        .catch((err: unknown) =>
          logger.error('Data changed broadcast failed', err),
        );

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

      logger.info('Sales records imported', {
        tenantId,
        createdCount: results.created,
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_CREATE',
          detail: `データ一括インポート: ${results.created}件追加`,
        })
        .catch((err) => logger.error('Audit log failed', err));

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
    if (startDateParam) {
      const d = jstStartOfDay(startDateParam);
      if (d) filters.startDate = d;
    }
    if (endDateParam) {
      const d = jstEndOfDay(endDateParam);
      if (d) filters.endDate = d;
    }
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
      logger.error('Failed to export sales records', error);
      return ApiResponse.serverError();
    }
  },

  /**
   * 速報用: id 指定で該当レコード 1 件を速報用に整形して返す。
   */
  async getBreakingNewsData(request: NextRequest) {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);

    const idParam = searchParams.get('id');
    if (!idParam) {
      return ApiResponse.badRequest('id is required');
    }
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return ApiResponse.badRequest('id is invalid');
    }

    // 表示中のディスプレイ設定ID（複数設定対応。速報設定の解決に使う）
    const configIdParam = searchParams.get('configId');
    const configId = configIdParam ? Number(configIdParam) : undefined;

    const { startDate, endDate } = currentJstMonthRange();

    try {
      const userIds = await resolveUserIds(
        tenantId,
        searchParams,
        startDate,
        endDate,
      );
      const record = await salesService.getBreakingNewsRecord(
        tenantId,
        id,
        userIds,
        Number.isFinite(configId) ? configId : undefined,
      );
      return ApiResponse.success({ record });
    } catch (error) {
      logger.error('Failed to fetch breaking news data', error);
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

      logger.info('Sales record deleted', {
        tenantId,
        recordId: id,
        userId: deleted.userId,
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'SALES_RECORD_DELETE',
          detail: `レコードID:${id}を削除（ユーザー:${deleted.user.name}）`,
        })
        .catch((err) => logger.error('Audit log failed', err));

      // 売上データの変更通知（ディスプレイデータ更新用）
      tenantEventsBroadcastService
        .notifyDataChanged(tenantId)
        .catch((err: unknown) =>
          logger.error('Data changed broadcast failed', err),
        );

      return ApiResponse.success({ message: '削除しました' });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete sales record');
    }
  },
};
