/**
 * 売上系 API のクエリパラメータ解決ヘルパー。
 *
 * 複数の controller / メソッドで共通して使う searchParams の解釈
 * （ユーザー絞り込み・データ種類・集計値・集計単位）を集約する。
 * controller を薄く保ち、同じパース処理の重複を防ぐ。
 */

import { MAIN_AGGREGATE_VALUE } from '@/const/salesView';
import type { AggregationUnit } from '@/types/salesView';

/**
 * グループフィルタ時は、指定期間内に所属していたメンバーのユニオンを返す。
 * startDate/endDate が渡されない場合は現在所属中のメンバーを返す。
 *
 * groupService に依存するが、lib → service の静的依存（循環）を避けるため
 * 動的 import を使う（server/lib/auth.ts と同じ流儀）。
 */
export async function resolveUserIds(
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
    // 不正な groupId（NaN）はフィルタなし扱い（無音の空結果を防ぐ）
    if (!Number.isFinite(gid)) return undefined;

    const { groupService } = await import('../services/groupService');

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

/** データ種類IDを解決する（未指定・不正値は undefined）。 */
export function resolveDataTypeId(
  searchParams: URLSearchParams,
): number | undefined {
  const dataTypeId = searchParams.get('dataTypeId');
  if (!dataTypeId) return undefined;
  const id = Number(dataTypeId);
  return Number.isFinite(id) ? id : undefined;
}

/**
 * 集計値（メイン値 / 集計対象カスタムフィールド）を解決する。
 * "" / "value"（メイン値）は undefined を返し、"cf_<id>" のみ値を返す。
 */
export function resolveAggregateField(
  searchParams: URLSearchParams,
): string | undefined {
  const v = searchParams.get('aggregateField');
  return v && v !== MAIN_AGGREGATE_VALUE ? v : undefined;
}

/** 集計単位（メンバー / グループ）を解決する。 */
export function resolveAggregationUnit(
  searchParams: URLSearchParams,
): AggregationUnit {
  return searchParams.get('aggregationUnit') === 'group' ? 'group' : 'member';
}
