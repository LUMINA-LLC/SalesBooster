import { groupRepository } from '../repositories/groupRepository';
import { groupTargetRepository } from '../repositories/groupTargetRepository';
import { getJstYearMonth } from '../lib/dateUtils';

/** グループ単位集計のために解決したスコープ情報 */
export interface GroupScope {
  /** テナント内の全グループ（id順、表示用に name/imageUrl 付き） */
  groups: { id: number; name: string; imageUrl?: string }[];
  /** groupId → 期間内に所属していたメンバーIDの集合 */
  memberIdsByGroup: Map<number, Set<string>>;
}

/**
 * グループ単位集計のスコープを解決する。
 * - 全グループ一覧（imageUrl 含む）
 * - 各グループの所属メンバーID（期間内ユニオン）
 * グループ件数に依存せず計2クエリで完結（N+1 回避）。
 */
export async function resolveGroupScope(
  tenantId: number,
  startDate: Date,
  endDate: Date,
): Promise<GroupScope> {
  const [groupRecords, memberRecords] = await Promise.all([
    groupRepository.findAll(tenantId),
    groupRepository.findAllGroupMembersByDateRange(
      tenantId,
      startDate,
      endDate,
    ),
  ]);

  const groups = groupRecords.map((g) => ({
    id: g.id,
    name: g.name,
    imageUrl: g.imageUrl ?? undefined,
  }));

  const memberIdsByGroup = new Map<number, Set<string>>();
  for (const g of groups) memberIdsByGroup.set(g.id, new Set());
  for (const m of memberRecords) {
    const set = memberIdsByGroup.get(m.groupId);
    if (set) set.add(m.userId);
  }

  return { groups, memberIdsByGroup };
}

/**
 * メンバー単位の集計Map（userId→値）を、グループ単位の集計Map（groupId→値）へ畳む。
 * 複数グループに所属するメンバーは、所属する各グループに加算する（グループ視点では正）。
 */
export function foldByGroup(
  memberMap: Map<string, number>,
  scope: GroupScope,
): Map<number, number> {
  const result = new Map<number, number>();
  for (const g of scope.groups) {
    const memberIds = scope.memberIdsByGroup.get(g.id);
    if (!memberIds) continue;
    let sum = 0;
    for (const uid of memberIds) sum += memberMap.get(uid) || 0;
    result.set(g.id, sum);
  }
  return result;
}

/**
 * 期間内の GroupTarget を groupId 別に合算した Map を返す。
 * dataTypeId は呼び出し側で resolveEffectiveDataTypeId 解決後の値を渡すこと
 * （GroupTarget は dataTypeId 完全一致で引くため、メンバー側と対象データ種類を揃える）。
 * 期間が複数年にまたがる場合は関与する各年で取得し、月レンジ内のみ合算する。
 */
export async function buildGroupTargetMap(
  tenantId: number,
  startDate: Date,
  endDate: Date,
  dataTypeId?: number,
): Promise<Map<number, number>> {
  const startYM = getJstYearMonth(startDate);
  const endYM = getJstYearMonth(endDate);

  // 関与する年の集合
  const years: number[] = [];
  for (let y = startYM.year; y <= endYM.year; y++) years.push(y);

  const startKey = startYM.year * 100 + startYM.month;
  const endKey = endYM.year * 100 + endYM.month;

  const map = new Map<number, number>();
  for (const year of years) {
    const targets = await groupTargetRepository.findByYearAndDataType(
      tenantId,
      year,
      dataTypeId,
    );
    for (const t of targets) {
      const key = t.year * 100 + t.month;
      if (key < startKey || key > endKey) continue;
      map.set(t.groupId, (map.get(t.groupId) || 0) + (t.value || 0));
    }
  }
  return map;
}
