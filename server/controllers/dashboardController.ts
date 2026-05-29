import { NextRequest } from 'next/server';
import { groupService } from '../services/groupService';
import { memberService } from '../services/memberService';
import { salesService } from '../services/salesService';
import { dataTypeService } from '../services/dataTypeService';
import { customFieldService } from '../services/customFieldService';
import { getTenantId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';
import { logger } from '@/lib/logger';

export const dashboardController = {
  /**
   * ダッシュボード初期表示に必要なセレクタ系マスターデータを 1 リクエストで返す。
   * （従来は groups / members / date-range / data-types / custom-fields を
   *   個別に取得しており、初期化中のリクエスト連発・キャンセルの原因になっていた）
   */
  async getInit(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);

      const [groups, members, dateRange, dataTypes] = await Promise.all([
        groupService.getAll(tenantId),
        memberService.getSalesMembers(tenantId),
        salesService.getDateRange(tenantId),
        dataTypeService.getActive(tenantId),
      ]);

      // 初期選択データ種類（isDefault 優先、なければ先頭）。
      // クライアント（旧 FilterBar）と同じ選択ロジックをサーバー側で実行する。
      const initialDataType =
        dataTypes.find((dt) => dt.isDefault) ?? dataTypes[0] ?? null;

      // 初期データ種類の集計対象カスタムフィールドも併せて返す（初回の追加 fetch を不要にする）
      const aggregatableFields = initialDataType
        ? await customFieldService.getAggregatable(tenantId, initialDataType.id)
        : [];

      return ApiResponse.success({
        groups,
        members,
        dateRange,
        dataTypes,
        aggregatableFields,
      });
    } catch (error) {
      logger.error('Failed to fetch dashboard init data', error);
      return ApiResponse.serverError();
    }
  },
};
