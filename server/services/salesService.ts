import { salesRecordRepository } from '../repositories/salesRecordRepository';
import { memberRepository } from '../repositories/memberRepository';
import { targetRepository } from '../repositories/targetRepository';
import { groupTargetRepository } from '../repositories/groupTargetRepository';
import { dataTypeRepository } from '../repositories/dataTypeRepository';
import { customFieldRepository } from '../repositories/customFieldRepository';
import { displayService } from './displayService';
import {
  resolveGroupScope,
  foldByGroup,
  buildGroupTargetMap,
  type GroupScope,
} from './groupAggregationService';
import {
  getJstYearMonth,
  toJstParts,
  formatJstMonthKey,
  jstNow,
  jstStartOfMonth,
  jstEndOfMonth,
  getJstDay,
  getJstDate,
} from '../lib/dateUtils';
import {
  ReportData,
  ReportSummary,
  ReportPeriodKey,
  ReportPeriodSummary,
  ReportDataTypeMetrics,
  ReportMetric,
  ReportAnnualChart,
} from '@/types/report';
import {
  SalesEntry,
  RankingBoardData,
  RankingColumn,
  RankingEntry,
  AggregationUnit,
} from '@/types/salesView';
import { MAIN_AGGREGATE_VALUE } from '@/const/salesView';
import { convertByUnit } from '@/lib/units';

type UserWithDepartment = Awaited<
  ReturnType<typeof memberRepository.findAll>
>[number];
type SalesRecordWithUser = Awaited<
  ReturnType<typeof salesRecordRepository.findByPeriod>
>[number];

/**
 * dataTypeIdからunitを取得。
 * dataTypeId 未指定時は isDefault=true のデータ種類の unit を使う。
 * デフォルトも無い場合は 'MAN_YEN'。同一キーは1度だけDB問い合わせ。
 */
const unitCache = new Map<string, Promise<string>>();
function resolveUnit(tenantId: number, dataTypeId?: number): Promise<string> {
  const key = dataTypeId
    ? `${tenantId}:${dataTypeId}`
    : `${tenantId}:__default__`;
  const cached = unitCache.get(key);
  if (cached) return cached;

  const promise: Promise<string> = (
    dataTypeId
      ? dataTypeRepository.findById(dataTypeId, tenantId)
      : dataTypeRepository.findDefault(tenantId)
  )
    .then((dt) => dt?.unit || 'MAN_YEN')
    .finally(() => {
      unitCache.delete(key);
    });
  unitCache.set(key, promise);
  return promise;
}

/**
 * dataTypeId 未指定時はデフォルトのデータ種類IDに解決する。
 * デフォルトが存在しなければ undefined を返す（=全データ種類で集計、後方互換）。
 */
async function resolveEffectiveDataTypeId(
  tenantId: number,
  dataTypeId?: number,
): Promise<number | undefined> {
  if (dataTypeId) return dataTypeId;
  const defaultDt = await dataTypeRepository.findDefault(tenantId);
  return defaultDt?.id;
}

/** カスタムフィールドIDからunitを取得（未指定/見つからない場合は'PIECE'） */
async function resolveCustomFieldUnit(
  tenantId: number,
  customFieldId: number,
): Promise<string> {
  const cf = await customFieldRepository.findById(customFieldId, tenantId);
  return cf?.unit || 'PIECE';
}

/** aggregateField から表示単位を解決 */
async function resolveAggregateUnit(
  tenantId: number,
  dataTypeId: number | undefined,
  aggregateField: AggregateField,
): Promise<string> {
  const cfId = parseCustomFieldId(aggregateField);
  if (cfId) {
    const num = Number(cfId);
    if (Number.isFinite(num)) return resolveCustomFieldUnit(tenantId, num);
    return 'PIECE';
  }
  return resolveUnit(tenantId, dataTypeId);
}

/** ランキング・売上対象メンバーのみ取得（role: USER かつ isOperator: false） */
async function fetchUsers(
  tenantId: number,
  userIds?: string[],
): Promise<UserWithDepartment[]> {
  if (userIds === undefined) {
    return memberRepository.findSalesMembers(tenantId);
  }
  if (userIds.length === 0) {
    return [];
  }
  return memberRepository.findSalesMembersByIds(userIds, tenantId);
}

/**
 * 集計対象フィールド指定:
 *  - undefined / 'value': レコード本体の value
 *  - 'cf_<id>': customFields[<id>] を数値として取得
 */
export type AggregateField = string | undefined;

/** カスタムフィールド指定からIDを抽出 */
function parseCustomFieldId(aggregateField: AggregateField): string | null {
  if (!aggregateField || aggregateField === MAIN_AGGREGATE_VALUE) return null;
  if (aggregateField.startsWith('cf_')) return aggregateField.slice(3);
  return null;
}

/** レコードの値を数値として取得 */
function getNumericValue(
  record: SalesRecordWithUser,
  aggregateField?: AggregateField,
): number {
  const cfId = parseCustomFieldId(aggregateField);
  if (!cfId) return record.value;
  const cf = record.customFields as Record<string, unknown> | null | undefined;
  if (!cf) return 0;
  const raw = cf[cfId];
  if (raw === undefined || raw === null || raw === '') return 0;
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : 0;
}

/** レコード配列からユーザーごとの合計Mapを構築 */
function buildSalesMap(
  records: SalesRecordWithUser[],
  aggregateField?: AggregateField,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const record of records) {
    const value = getNumericValue(record, aggregateField);
    map.set(record.userId, (map.get(record.userId) || 0) + value);
  }
  return map;
}

/** 期間内の各月の実際の目標値を合算したMapを構築 */
async function buildTargetMap(
  tenantId: number,
  userIds: string[],
  startDate: Date,
  endDate: Date,
  dataTypeId?: number,
): Promise<Map<string, number>> {
  const startYM = getJstYearMonth(startDate);
  const endYM = getJstYearMonth(endDate);
  const targets = await targetRepository.findByUsersAndPeriodRange(
    userIds,
    startYM.year,
    startYM.month,
    endYM.year,
    endYM.month,
    tenantId,
  );
  const filtered = dataTypeId
    ? targets.filter(
        (t: { dataTypeId: number | null }) => t.dataTypeId === dataTypeId,
      )
    : targets;
  const map = new Map<string, number>();
  for (const t of filtered) {
    map.set(t.userId, (map.get(t.userId) || 0) + (t.value || 0));
  }
  return map;
}

/** ユーザー・売上Map・目標Mapからランキングつき SalesEntry 配列を構築 */
function buildSalesPeople(
  users: UserWithDepartment[],
  salesMap: Map<string, number>,
  targetMap: Map<string, number>,
  unit: string = 'MAN_YEN',
): SalesEntry[] {
  const salesPeople: SalesEntry[] = users.map((user) => {
    const salesRaw = salesMap.get(user.id) || 0;
    const targetRaw = targetMap.get(user.id) || 0;
    const sales = convertByUnit(salesRaw, unit);
    const target = convertByUnit(targetRaw, unit);
    const achievement =
      targetRaw > 0 ? Math.round((salesRaw / targetRaw) * 100) : 0;

    return {
      rank: 0,
      name: user.name || '',
      sales,
      target,
      achievement,
      imageUrl: user.imageUrl || undefined,
      department: user.department?.name || undefined,
    };
  });

  salesPeople.sort((a, b) => b.sales - a.sales);
  salesPeople.forEach((p, i) => (p.rank = i + 1));
  return salesPeople;
}

/**
 * グループ・グループ売上Map・グループ目標Mapから
 * ランキングつき SalesEntry 配列を構築する（name=グループ名, imageUrl=グループアイコン）。
 * buildSalesPeople と同じ rank 採番ロジック。
 */
function buildGroupSalesPeople(
  scope: GroupScope,
  groupSalesMap: Map<number, number>,
  groupTargetMap: Map<number, number>,
  unit: string = 'MAN_YEN',
): SalesEntry[] {
  const salesPeople: SalesEntry[] = scope.groups.map((g) => {
    const salesRaw = groupSalesMap.get(g.id) || 0;
    const targetRaw = groupTargetMap.get(g.id) || 0;
    const sales = convertByUnit(salesRaw, unit);
    const target = convertByUnit(targetRaw, unit);
    const achievement =
      targetRaw > 0 ? Math.round((salesRaw / targetRaw) * 100) : 0;

    return {
      rank: 0,
      name: g.name,
      sales,
      target,
      achievement,
      imageUrl: g.imageUrl,
      department: undefined,
    };
  });

  salesPeople.sort((a, b) => b.sales - a.sales);
  salesPeople.forEach((p, i) => (p.rank = i + 1));
  return salesPeople;
}

/**
 * グループ単位の SalesEntry 配列を算出する（期間グラフ・累計グラフ共通）。
 * 全レコード（絞り込みなし）をグループごとに畳み、グループ目標と突き合わせて
 * ランキングつき SalesEntry を返す。records 件数も併せて返す。
 * dataTypeId / unit / isCustomFieldAgg は呼び出し側で解決済みの値を渡すこと。
 */
async function computeGroupSalesEntries(
  tenantId: number,
  startDate: Date,
  endDate: Date,
  dataTypeId: number | undefined,
  aggregateField: AggregateField,
  isCustomFieldAgg: boolean,
  unit: string,
): Promise<{ salesPeople: SalesEntry[]; recordCount: number }> {
  const [records, scope] = await Promise.all([
    salesRecordRepository.findByPeriod(
      startDate,
      endDate,
      tenantId,
      undefined,
      dataTypeId,
    ),
    resolveGroupScope(tenantId, startDate, endDate),
  ]);
  const groupSalesMap = foldByGroup(
    buildSalesMap(records, aggregateField),
    scope,
  );
  // カスタムフィールド集計時は目標の比較対象が変わるため目標は空にする
  const groupTargetMap = isCustomFieldAgg
    ? new Map<number, number>()
    : await buildGroupTargetMap(tenantId, startDate, endDate, dataTypeId);
  const salesPeople = buildGroupSalesPeople(
    scope,
    groupSalesMap,
    groupTargetMap,
    unit,
  );
  return { salesPeople, recordCount: records.length };
}

/**
 * 期間内の月別合計Mapを構築（0初期化つき）。
 */
function buildMonthlyMap(
  startDate: Date,
  endDate: Date,
  records: SalesRecordWithUser[],
  aggregateField?: AggregateField,
): Map<string, number> {
  const map = new Map<string, number>();
  const startYM = getJstYearMonth(startDate);
  const endYM = getJstYearMonth(endDate);
  let y = startYM.year;
  let m = startYM.month;
  while (y < endYM.year || (y === endYM.year && m <= endYM.month)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    map.set(key, 0);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  for (const r of records) {
    const key = formatJstMonthKey(new Date(r.recordDate));
    const value = getNumericValue(r, aggregateField);
    map.set(key, (map.get(key) || 0) + value);
  }
  return map;
}

export const salesService = {
  async getSalesByDateRange(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    userIds?: string[],
    dataTypeId?: number,
    aggregateField?: AggregateField,
    aggregationUnit: AggregationUnit = 'member',
  ): Promise<{ salesPeople: SalesEntry[]; recordCount: number }> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    const isCustomFieldAgg = !!parseCustomFieldId(aggregateField);
    const unit = await resolveAggregateUnit(
      tenantId,
      dataTypeId,
      aggregateField,
    );

    // グループ単位: 全レコードを取得し、グループごとに畳んで集計する
    if (aggregationUnit === 'group') {
      return computeGroupSalesEntries(
        tenantId,
        startDate,
        endDate,
        dataTypeId,
        aggregateField,
        isCustomFieldAgg,
        unit,
      );
    }

    const [records, users] = await Promise.all([
      salesRecordRepository.findByPeriod(
        startDate,
        endDate,
        tenantId,
        userIds,
        dataTypeId,
      ),
      fetchUsers(tenantId, userIds),
    ]);

    const salesMap = buildSalesMap(records, aggregateField);
    const ids = users.map((m) => m.id);
    // カスタムフィールド集計時は目標値の比較対象が変わるので0で埋める
    const targetMap = isCustomFieldAgg
      ? new Map<string, number>()
      : await buildTargetMap(tenantId, ids, startDate, endDate, dataTypeId);
    const salesPeople = buildSalesPeople(users, salesMap, targetMap, unit);

    return { salesPeople, recordCount: records.length };
  },

  async getCumulativeSales(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    userIds?: string[],
    dataTypeId?: number,
    aggregateField?: AggregateField,
    aggregationUnit: AggregationUnit = 'member',
  ): Promise<SalesEntry[]> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    const isCustomFieldAgg = !!parseCustomFieldId(aggregateField);
    const unit = await resolveAggregateUnit(
      tenantId,
      dataTypeId,
      aggregateField,
    );

    if (aggregationUnit === 'group') {
      const { salesPeople } = await computeGroupSalesEntries(
        tenantId,
        startDate,
        endDate,
        dataTypeId,
        aggregateField,
        isCustomFieldAgg,
        unit,
      );
      return salesPeople;
    }

    const [records, users] = await Promise.all([
      salesRecordRepository.findByPeriod(
        startDate,
        endDate,
        tenantId,
        userIds,
        dataTypeId,
      ),
      fetchUsers(tenantId, userIds),
    ]);

    const salesMap = buildSalesMap(records, aggregateField);
    const ids = users.map((m) => m.id);
    const targetMap = isCustomFieldAgg
      ? new Map<string, number>()
      : await buildTargetMap(tenantId, ids, startDate, endDate, dataTypeId);

    return buildSalesPeople(users, salesMap, targetMap, unit);
  },

  async getTrendData(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    userIds?: string[],
    dataTypeId?: number,
    aggregateField?: AggregateField,
  ) {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    const startYM = getJstYearMonth(startDate);
    const endYM = getJstYearMonth(endDate);
    const periodStart = jstStartOfMonth(startYM.year, startYM.month);
    const periodEnd = jstEndOfMonth(endYM.year, endYM.month);
    const unit = await resolveAggregateUnit(
      tenantId,
      dataTypeId,
      aggregateField,
    );
    const records = await salesRecordRepository.findByPeriod(
      periodStart,
      periodEnd,
      tenantId,
      userIds,
      dataTypeId,
    );

    const monthlyMap = buildMonthlyMap(
      startDate,
      endDate,
      records,
      aggregateField,
    );

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, totalValue]) => {
        const m = parseInt(month.split('-')[1]);
        return {
          month,
          sales: convertByUnit(totalValue, unit),
          displayMonth: `${m}月`,
        };
      });
  },

  async getDateRange(
    tenantId: number,
  ): Promise<{ minDate: Date; maxDate: Date } | null> {
    const minDate = await salesRecordRepository.findMinDate(tenantId);
    if (!minDate) return null;
    return { minDate, maxDate: new Date() };
  },

  async getReportData(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    userIds?: string[],
    dataTypeId?: number,
  ): Promise<ReportData> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    const unit = await resolveUnit(tenantId, dataTypeId);
    const records = await salesRecordRepository.findByPeriod(
      startDate,
      endDate,
      tenantId,
      userIds,
      dataTypeId,
    );
    const conv = (v: number) => convertByUnit(v, unit);

    const monthlyMap = buildMonthlyMap(startDate, endDate, records);

    const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    const salesValues = sortedMonths.map(([, v]) => conv(v));

    const monthlyTrend = sortedMonths.map(([month, amount], i) => {
      const [y, m] = month.split('-');
      let movingAvg: number | null = null;
      if (i >= 2) {
        movingAvg = Math.round(
          (salesValues[i] + salesValues[i - 1] + salesValues[i - 2]) / 3,
        );
      }
      return {
        month,
        displayMonth: `${y.slice(2)}/${m}`,
        sales: conv(amount),
        movingAvg,
      };
    });

    let cumulative = 0;
    const cumulativeTrend = sortedMonths.map(([month, amount]) => {
      cumulative += conv(amount);
      const [y, m] = month.split('-');
      return {
        month,
        displayMonth: `${y.slice(2)}/${m}`,
        cumulative,
      };
    });

    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayAmounts = new Array(7).fill(0);
    for (const r of records) {
      const dow = getJstDay(new Date(r.recordDate));
      dayAmounts[dow] += getNumericValue(r);
    }
    const dayTotal = dayAmounts.reduce((a: number, b: number) => a + b, 0) || 1;
    const dayOfWeekRatio = dayNames.map((day, i) => ({
      day,
      amount: conv(dayAmounts[i]),
      ratio: Math.round((dayAmounts[i] / dayTotal) * 100),
    }));

    const periodAmounts = [0, 0, 0];
    for (const r of records) {
      const date = getJstDate(new Date(r.recordDate));
      const value = getNumericValue(r);
      if (date <= 10) periodAmounts[0] += value;
      else if (date <= 20) periodAmounts[1] += value;
      else periodAmounts[2] += value;
    }
    const periodTotal = periodAmounts.reduce((a, b) => a + b, 0) || 1;
    const periodLabels = ['前半10日間', '中盤10日間', '後半10日間'];
    const periodRatio = periodLabels.map((period, i) => ({
      period,
      amount: conv(periodAmounts[i]),
      ratio: Math.round((periodAmounts[i] / periodTotal) * 100),
    }));

    const nowJst = jstNow();
    const recentMonths = sortedMonths.slice(-3);
    const recentSales = recentMonths.map(([, v]) => conv(v));
    const monthlyAvg =
      recentSales.length > 0
        ? Math.round(
            recentSales.reduce((a, b) => a + b, 0) / recentSales.length,
          )
        : 0;

    const totalDays = recentMonths.length * 30;
    const totalRecentSales = recentSales.reduce((a, b) => a + b, 0);
    const dailyAvg =
      totalDays > 0 ? Math.round((totalRecentSales / totalDays) * 10) / 10 : 0;

    const users = await fetchUsers(tenantId, userIds);
    const targets = await targetRepository.findByUsersAndPeriod(
      users.map((m) => m.id),
      nowJst.year,
      nowJst.month,
      tenantId,
    );
    const filteredTargets = dataTypeId
      ? targets.filter(
          (t: { dataTypeId: number | null }) => t.dataTypeId === dataTypeId,
        )
      : targets;
    const monthlyTarget = conv(
      filteredTargets.reduce(
        (sum: number, t: { value: number }) => sum + (t.value || 0),
        0,
      ),
    );

    const targetDays =
      dailyAvg > 0 ? Math.round((monthlyTarget / dailyAvg) * 10) / 10 : 0;
    const targetMonths =
      monthlyAvg > 0 ? Math.round((monthlyTarget / monthlyAvg) * 10) / 10 : 0;

    const currentMonthKey = `${nowJst.year}-${String(nowJst.month).padStart(2, '0')}`;
    const currentMonthSales = conv(monthlyMap.get(currentMonthKey) || 0);
    const daysInMonth = toJstParts(
      jstEndOfMonth(nowJst.year, nowJst.month),
    ).day;
    const remainingDays = daysInMonth - nowJst.day;
    const landingPrediction =
      Math.round((currentMonthSales + remainingDays * dailyAvg) * 10) / 10;
    const landingMonth = `${String(nowJst.year).slice(2)}/${String(nowJst.month).padStart(2, '0')}`;

    return {
      monthlyTrend,
      cumulativeTrend,
      dayOfWeekRatio,
      periodRatio,
      stats: {
        monthlyAvg,
        dailyAvg,
        targetDays,
        targetMonths,
        landingPrediction,
        landingMonth,
      },
    };
  },

  async getRankingBoardData(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    userIds?: string[],
    dataTypeId?: number,
    aggregateField?: AggregateField,
    aggregationUnit: AggregationUnit = 'member',
  ): Promise<RankingBoardData> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    // 月別カラムは常に「直近3ヶ月」固定(現在月 / 前月 / 2ヶ月前)
    const nowJst = jstNow();
    let startY = nowJst.year;
    let startM = nowJst.month - 2;
    while (startM < 1) {
      startM += 12;
      startY -= 1;
    }
    const recentMonthsStart = jstStartOfMonth(startY, startM);
    const recentMonthsEnd = jstEndOfMonth(nowJst.year, nowJst.month);

    // TOTAL集計範囲と月別範囲のうち広いほうで一度だけDB取得し、filterで使い分け
    const fetchStart =
      startDate < recentMonthsStart ? startDate : recentMonthsStart;
    const fetchEnd = endDate > recentMonthsEnd ? endDate : recentMonthsEnd;

    const isGroup = aggregationUnit === 'group';
    // グループ単位は全レコード（絞り込みなし）で集計する
    const fetchUserIds = isGroup ? undefined : userIds;
    const [users, allRecords, scope] = await Promise.all([
      isGroup
        ? Promise.resolve<UserWithDepartment[]>([])
        : fetchUsers(tenantId, userIds),
      salesRecordRepository.findByPeriod(
        fetchStart,
        fetchEnd,
        tenantId,
        fetchUserIds,
        dataTypeId,
      ),
      isGroup
        ? resolveGroupScope(tenantId, fetchStart, fetchEnd)
        : Promise.resolve<GroupScope | null>(null),
    ]);

    // 直近3ヶ月の月キー(降順)
    const monthKeys: string[] = [];
    let y = startY;
    let m = startM;
    while (y < nowJst.year || (y === nowJst.year && m <= nowJst.month)) {
      monthKeys.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    monthKeys.reverse();

    const buildRanking = (records: SalesRecordWithUser[]): RankingEntry[] => {
      const salesByUser = new Map<string, number>();
      for (const r of records) {
        salesByUser.set(
          r.userId,
          (salesByUser.get(r.userId) || 0) + getNumericValue(r, aggregateField),
        );
      }

      // 集計対象（メンバー or グループ）と名前・アイコンを解決
      const entities: { name: string; imageUrl?: string; amount: number }[] =
        isGroup && scope
          ? scope.groups.map((g) => {
              const memberIds = scope.memberIdsByGroup.get(g.id);
              let amount = 0;
              if (memberIds)
                for (const uid of memberIds)
                  amount += salesByUser.get(uid) || 0;
              return { name: g.name, imageUrl: g.imageUrl, amount };
            })
          : users.map((u: UserWithDepartment) => ({
              name: u.name || '',
              imageUrl: u.imageUrl || undefined,
              amount: salesByUser.get(u.id) || 0,
            }));

      return entities
        .filter((e) => e.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .map((e, i) => ({ rank: i + 1, ...e }));
    };

    const monthColumns: RankingColumn[] = monthKeys.map((key) => {
      const [y, m] = key.split('-');
      const monthRecords = allRecords.filter((r: SalesRecordWithUser) => {
        return formatJstMonthKey(new Date(r.recordDate)) === key;
      });
      return {
        label: `${y}/${m}`,
        isTotal: false,
        entries: buildRanking(monthRecords),
      };
    });

    // TOTAL集計: 引数で指定された期間のレコードのみ
    const totalRecords = allRecords.filter((r: SalesRecordWithUser) => {
      const d = new Date(r.recordDate);
      return d >= startDate && d <= endDate;
    });
    // フロントは JST で月の境界 Date を生成して送るため、
    // サーバプロセスのタイムゾーンに依存せず JST として年/月を取り出す
    const startYM = getJstYearMonth(startDate);
    const endYM = getJstYearMonth(endDate);
    const startLabel = `${String(startYM.year).slice(2)}/${String(startYM.month).padStart(2, '0')}`;
    const endLabel = `${String(endYM.year).slice(2)}/${String(endYM.month).padStart(2, '0')}`;
    const totalColumn: RankingColumn = {
      label: 'TOTAL',
      subLabel: `${startLabel}〜${endLabel}`,
      isTotal: true,
      entries: buildRanking(totalRecords),
    };

    return { columns: [totalColumn, ...monthColumns] };
  },

  async createSalesRecord(
    tenantId: number,
    data: {
      userId: string;
      value: number;
      description?: string;
      recordDate: Date;
      customFields?: Record<string, string>;
      dataTypeId?: number;
      notifyBreakingNews?: boolean;
    },
  ) {
    return salesRecordRepository.create(tenantId, data);
  },

  async getSalesRecords(
    tenantId: number,
    page: number,
    pageSize: number,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      userIds?: string[];
      dataTypeId?: number;
    },
  ) {
    const { records, total } = await salesRecordRepository.findPaginated(
      page,
      pageSize,
      tenantId,
      filters,
    );
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      records: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        memberName: r.user.name || '',
        department: r.user.department?.name || null,
        value: r.value,
        dataTypeId: r.dataTypeId,
        dataType: r.dataType
          ? { id: r.dataType.id, name: r.dataType.name, unit: r.dataType.unit }
          : null,
        description: r.description,
        customFields: (r.customFields as Record<string, string>) || null,
        recordDate: r.recordDate.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  async getAllSalesRecords(
    tenantId: number,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      userIds?: string[];
      dataTypeId?: number;
    },
  ) {
    const records = await salesRecordRepository.findAll(tenantId, filters);
    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      memberName: r.user.name || '',
      department: r.user.department?.name || null,
      value: r.value,
      dataTypeId: r.dataTypeId,
      dataType: r.dataType
        ? { id: r.dataType.id, name: r.dataType.name, unit: r.dataType.unit }
        : null,
      description: r.description,
      customFields: (r.customFields as Record<string, string>) || null,
      recordDate: r.recordDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async updateSalesRecord(
    tenantId: number,
    id: number,
    data: {
      userId?: string;
      value?: number;
      description?: string;
      recordDate?: Date;
      customFields?: Record<string, string>;
      dataTypeId?: number;
    },
  ) {
    const existing = await salesRecordRepository.findById(id, tenantId);
    if (!existing) return null;
    await salesRecordRepository.update(id, tenantId, data);
    return salesRecordRepository.findById(id, tenantId);
  },

  async deleteSalesRecord(tenantId: number, id: number) {
    const existing = await salesRecordRepository.findById(id, tenantId);
    if (!existing) return null;
    await salesRecordRepository.remove(id, tenantId);
    return existing;
  },

  /**
   * 前期（前月 or 前年同月）のチーム1人あたり平均売上を返す
   */
  async getPreviousPeriodAverage(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    type: 'prev_month' | 'prev_year',
    userIds?: string[],
    dataTypeId?: number,
  ): Promise<number> {
    let prevStart: Date;
    let prevEnd: Date;

    const startYM = getJstYearMonth(startDate);
    const endYM = getJstYearMonth(endDate);

    if (type === 'prev_month') {
      // 前月の同月: 月-1 (1月→前年12月)
      let py = startYM.year;
      let pm = startYM.month - 1;
      if (pm < 1) {
        pm += 12;
        py -= 1;
      }
      prevStart = jstStartOfMonth(py, pm);
      prevEnd = jstEndOfMonth(py, pm);
    } else {
      // 前年同月レンジ
      prevStart = jstStartOfMonth(startYM.year - 1, startYM.month);
      prevEnd = jstEndOfMonth(endYM.year - 1, endYM.month);
    }

    const unit = await resolveUnit(tenantId, dataTypeId);
    const [records, users] = await Promise.all([
      salesRecordRepository.findByPeriod(
        prevStart,
        prevEnd,
        tenantId,
        userIds,
        dataTypeId,
      ),
      fetchUsers(tenantId, userIds),
    ]);

    if (users.length === 0) return 0;

    const totalSales = records.reduce((sum, r) => sum + getNumericValue(r), 0);
    return convertByUnit(Math.round(totalSales / users.length), unit);
  },

  /**
   * 速報用: ID 指定で 1 件のレコードを速報用フォーマットに整形して返す。
   * - 該当レコードが存在しない / テナントが一致しない場合は null
   * - notifyBreakingNews=false のレコードは null
   * - userIds が指定されている場合、対象外なら null
   * - データ種別ごとに enabled=false の場合は null
   */
  async getBreakingNewsRecord(
    tenantId: number,
    id: number,
    userIds?: string[],
    configId?: number,
  ) {
    const [record, breakingConfig] = await Promise.all([
      salesRecordRepository.findById(id, tenantId),
      displayService.getBreakingNewsResolvedConfig(tenantId, configId),
    ]);
    if (!record) return null;
    if (!record.notifyBreakingNews) return null;
    if (userIds && !userIds.includes(record.userId)) return null;

    const { defaultMessage, defaultVideoId, perDataType } = breakingConfig;
    const pc =
      record.dataTypeId !== null && record.dataTypeId !== undefined
        ? perDataType[record.dataTypeId]
        : undefined;
    if (pc && !pc.enabled) return null;

    const unit = record.dataType?.unit || 'MAN_YEN';
    return {
      id: record.id,
      memberName: record.user.name || '',
      memberImageUrl: record.user.imageUrl || undefined,
      value: convertByUnit(record.value, unit),
      unit,
      dataTypeId: record.dataTypeId ?? null,
      dataTypeName: record.dataType?.name || '',
      breakingNewsMessage: pc?.message ?? defaultMessage,
      breakingNewsVideoId: pc?.videoId ?? defaultVideoId,
      createdAt: record.createdAt.toISOString(),
    };
  },

  async importSalesRecords(
    tenantId: number,
    records: {
      userId: string;
      value: number;
      recordDate: string;
      description?: string;
      customFields?: Record<string, string>;
      dataTypeId?: number;
    }[],
  ) {
    const data = records.map((r) => ({
      userId: r.userId,
      value: r.value,
      description: r.description || undefined,
      recordDate: new Date(r.recordDate),
      dataTypeId: r.dataTypeId,
      ...(r.customFields ? { customFields: r.customFields } : {}),
    }));

    const result = await salesRecordRepository.createMany(tenantId, data);
    return { created: result.count };
  },

  /**
   * レポートサマリー: データ種類ごとの集計を複数期間（今月/先月/過去3・6・12ヶ月平均）で返し、
   * さらに年間棒グラフ（今年度 vs 前年度の月別実績）を返す。
   *
   * - 平均期間は「月あたり平均値」（期間合計 ÷ 月数）。
   * - 目標・達成率はメイン値のみ（カスタムフィールドは値のみ）。
   * - フィルタ（グループ/メンバー）は呼び出し側が解決した userIds で渡す。
   *
   * @param baseDate 基準月（この月を「今月」とみなす）
   */
  async getReportSummary(
    tenantId: number,
    baseDate: Date,
    userIds?: string[],
    aggregationUnit: AggregationUnit = 'member',
  ): Promise<ReportSummary> {
    const isGroup = aggregationUnit === 'group';
    // グループ単位は全社実績（絞り込みなし）に対しグループ目標合計で比較する
    const effectiveUserIds = isGroup ? undefined : userIds;
    const baseYM = getJstYearMonth(baseDate);

    // 集計に必要な最も広い範囲: 基準月の 23 ヶ月前の月初 〜 基準月の月末。
    // 年間グラフは「当年 12 ヶ月（基準月含む過去方向）」と「その各月の前年同月」を比較するため、
    // 最も古いのは当年グラフ最古月（基準月の11ヶ月前）のさらに前年（=基準月の23ヶ月前）。
    // この範囲を 1 クエリで取得し、全期間集計と年間グラフをまかなう。
    const startYM = (() => {
      let y = baseYM.year;
      let m = baseYM.month - 23;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      return { year: y, month: m };
    })();
    const rangeStart = jstStartOfMonth(startYM.year, startYM.month);
    const rangeEnd = jstEndOfMonth(baseYM.year, baseYM.month);

    // データ種類・カスタムフィールド定義・レコード・目標を並列取得
    const [dataTypes, records] = await Promise.all([
      dataTypeRepository.findActive(tenantId),
      salesRecordRepository.findByPeriod(
        rangeStart,
        rangeEnd,
        tenantId,
        effectiveUserIds,
      ),
    ]);

    // 各データ種類の集計対象カスタムフィールド定義
    const cfByDataType = new Map<
      number,
      { id: number; name: string; unit: string }[]
    >();
    await Promise.all(
      dataTypes.map(async (dt) => {
        const cfs = await customFieldRepository.findAggregatable(
          tenantId,
          dt.id,
        );
        cfByDataType.set(
          dt.id,
          cfs.map((c) => ({ id: c.id, name: c.name, unit: c.unit })),
        );
      }),
    );

    // 目標: 前年同月〜基準月の Target（メンバー単位）/ GroupTarget（グループ単位）を取得。
    // グループ単位は全グループ目標を月別・データ種別に合算して比較対象にする。
    const allTargets = isGroup
      ? []
      : effectiveUserIds && effectiveUserIds.length === 0
        ? []
        : await targetRepository.findByUsersAndPeriodRange(
            effectiveUserIds ?? (await fetchUsers(tenantId)).map((u) => u.id),
            baseYM.year - 1,
            baseYM.month,
            baseYM.year,
            baseYM.month,
            tenantId,
          );

    // グループ単位の目標: 関与年×データ種別ごとに GroupTarget を取得し全グループ合算
    const allGroupTargets: {
      year: number;
      month: number;
      dataTypeId: number | null;
      value: number;
    }[] = [];
    if (isGroup) {
      const targetYears = Array.from(new Set([baseYM.year - 1, baseYM.year]));
      await Promise.all(
        targetYears.flatMap((year) =>
          dataTypes.map(async (dt) => {
            const gts = await groupTargetRepository.findByYearAndDataType(
              tenantId,
              year,
              dt.id,
            );
            for (const g of gts) {
              allGroupTargets.push({
                year: g.year,
                month: g.month,
                dataTypeId: g.dataTypeId,
                value: g.value,
              });
            }
          }),
        ),
      );
    }

    // ---- 集計用インデックス ----
    // 月キー("YYYY-MM") → dataTypeId → { main: number, cf: Map<cfId, number> }
    const salesByMonth = new Map<
      string,
      Map<number, { main: number; cf: Map<number, number> }>
    >();
    for (const r of records) {
      if (r.dataTypeId === null || r.dataTypeId === undefined) continue;
      const monthKey = formatJstMonthKey(new Date(r.recordDate));
      let dtMap = salesByMonth.get(monthKey);
      if (!dtMap) {
        dtMap = new Map();
        salesByMonth.set(monthKey, dtMap);
      }
      let agg = dtMap.get(r.dataTypeId);
      if (!agg) {
        agg = { main: 0, cf: new Map() };
        dtMap.set(r.dataTypeId, agg);
      }
      agg.main += r.value;
      const cfs = cfByDataType.get(r.dataTypeId) ?? [];
      const cfValues = r.customFields as Record<string, unknown> | null;
      for (const cf of cfs) {
        const raw = cfValues?.[String(cf.id)];
        const num =
          raw === undefined || raw === null || raw === ''
            ? 0
            : typeof raw === 'number'
              ? raw
              : Number(raw);
        if (Number.isFinite(num) && num !== 0) {
          agg.cf.set(cf.id, (agg.cf.get(cf.id) || 0) + num);
        }
      }
    }

    // 月キー → dataTypeId → 目標合計（メイン値）。
    // グループ単位は GroupTarget、メンバー単位は Target を使う。
    const targetByMonth = new Map<string, Map<number, number>>();
    const targetSource = isGroup ? allGroupTargets : allTargets;
    for (const t of targetSource) {
      if (t.dataTypeId === null || t.dataTypeId === undefined) continue;
      const monthKey = `${t.year}-${String(t.month).padStart(2, '0')}`;
      let dtMap = targetByMonth.get(monthKey);
      if (!dtMap) {
        dtMap = new Map();
        targetByMonth.set(monthKey, dtMap);
      }
      dtMap.set(t.dataTypeId, (dtMap.get(t.dataTypeId) || 0) + (t.value || 0));
    }

    // 基準月から n ヶ月分の月キー一覧（基準月含む、過去方向）
    const monthKeysBack = (n: number): string[] => {
      const keys: string[] = [];
      let y = baseYM.year;
      let m = baseYM.month;
      for (let i = 0; i < n; i++) {
        keys.push(`${y}-${String(m).padStart(2, '0')}`);
        m--;
        if (m < 1) {
          m = 12;
          y--;
        }
      }
      return keys;
    };

    // 平均期間の実期間ラベル（最古月〜基準月）を "YYYY/MM〜YYYY/MM" で返す
    const avgRangeLabel = (n: number): string => {
      const keys = monthKeysBack(n); // [基準月, ..., 最古月]
      const toLabel = (key: string) => key.replace('-', '/');
      const oldest = toLabel(keys[keys.length - 1]);
      const newest = toLabel(keys[0]);
      return `${oldest}〜${newest}`;
    };

    // 指定月キー群の「データ種類別 集計」を月数で平均（divisor=1 なら合計のまま=今月/先月用）
    const buildDataTypeMetrics = (
      monthKeys: string[],
      divisor: number,
    ): ReportDataTypeMetrics[] => {
      return dataTypes.map((dt) => {
        const cfs = cfByDataType.get(dt.id) ?? [];
        let mainSum = 0;
        let targetSum = 0;
        const cfSums = new Map<number, number>();
        for (const key of monthKeys) {
          const agg = salesByMonth.get(key)?.get(dt.id);
          if (agg) {
            mainSum += agg.main;
            for (const cf of cfs) {
              cfSums.set(
                cf.id,
                (cfSums.get(cf.id) || 0) + (agg.cf.get(cf.id) || 0),
              );
            }
          }
          targetSum += targetByMonth.get(key)?.get(dt.id) || 0;
        }
        const mainValue = convertByUnit(Math.round(mainSum / divisor), dt.unit);
        const targetValue = convertByUnit(
          Math.round(targetSum / divisor),
          dt.unit,
        );
        const main: ReportMetric = {
          value: mainValue,
          target: targetSum > 0 ? targetValue : null,
          achievement:
            targetValue > 0
              ? Math.round((mainValue / targetValue) * 100)
              : null,
          unit: dt.unit,
        };
        return {
          dataTypeId: dt.id,
          dataTypeName: dt.name,
          main,
          customFields: cfs.map((cf) => ({
            id: cf.id,
            name: cf.name,
            metric: {
              value: convertByUnit(
                Math.round((cfSums.get(cf.id) || 0) / divisor),
                cf.unit,
              ),
              target: null,
              achievement: null,
              unit: cf.unit,
            } as ReportMetric,
          })),
        };
      });
    };

    // ---- 5 期間を構築 ----
    const prevYM = (() => {
      let y = baseYM.year;
      let m = baseYM.month - 1;
      if (m < 1) {
        m = 12;
        y--;
      }
      return { year: y, month: m };
    })();

    const periods: ReportPeriodSummary[] = [
      {
        periodKey: 'current' as ReportPeriodKey,
        label: `${baseYM.year}/${String(baseYM.month).padStart(2, '0')}`,
        dataTypes: buildDataTypeMetrics(monthKeysBack(1), 1),
      },
      {
        periodKey: 'prevMonth' as ReportPeriodKey,
        label: `${prevYM.year}/${String(prevYM.month).padStart(2, '0')}`,
        dataTypes: buildDataTypeMetrics(
          [`${prevYM.year}-${String(prevYM.month).padStart(2, '0')}`],
          1,
        ),
      },
      {
        periodKey: 'avg3m' as ReportPeriodKey,
        label: `過去3ヶ月平均（${avgRangeLabel(3)}）`,
        dataTypes: buildDataTypeMetrics(monthKeysBack(3), 3),
      },
      {
        periodKey: 'avg6m' as ReportPeriodKey,
        label: `過去6ヶ月平均（${avgRangeLabel(6)}）`,
        dataTypes: buildDataTypeMetrics(monthKeysBack(6), 6),
      },
      {
        periodKey: 'avg1y' as ReportPeriodKey,
        label: `過去1年平均（${avgRangeLabel(12)}）`,
        dataTypes: buildDataTypeMetrics(monthKeysBack(12), 12),
      },
    ];

    // ---- 年間棒グラフ: データ種類ごと、当年12ヶ月（基準月含む過去方向）と前年同月の実績 ----
    const thisYearKeys = monthKeysBack(12).reverse(); // 古い→新しい
    const annualCharts: ReportAnnualChart[] = dataTypes.map((dt) => {
      const months = thisYearKeys.map((key) => {
        const [yStr, mStr] = key.split('-');
        const y = Number(yStr);
        const m = Number(mStr);
        const lastKey = `${y - 1}-${mStr}`;
        const thisAgg = salesByMonth.get(key)?.get(dt.id);
        const lastAgg = salesByMonth.get(lastKey)?.get(dt.id);
        return {
          month: key,
          displayMonth: `${m}月`,
          thisYear: convertByUnit(thisAgg?.main || 0, dt.unit),
          lastYear: convertByUnit(lastAgg?.main || 0, dt.unit),
        };
      });
      return {
        dataTypeId: dt.id,
        dataTypeName: dt.name,
        unit: dt.unit,
        months,
      };
    });

    return { periods, annualCharts };
  },
};
