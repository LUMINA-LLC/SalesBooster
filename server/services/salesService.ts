import { salesRecordRepository } from '../repositories/salesRecordRepository';
import { memberRepository } from '../repositories/memberRepository';
import { targetRepository } from '../repositories/targetRepository';
import { dataTypeRepository } from '../repositories/dataTypeRepository';
import { customFieldRepository } from '../repositories/customFieldRepository';
import { displayService } from './displayService';
import {
  SalesPerson,
  ReportData,
  RankingBoardData,
  RankingColumn,
  RankingMember,
} from '@/types';
import { convertByUnit } from '@/lib/currency';

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
  if (!aggregateField || aggregateField === 'value') return null;
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
  const targets = await targetRepository.findByUsersAndPeriodRange(
    userIds,
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    endDate.getFullYear(),
    endDate.getMonth() + 1,
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

/** ユーザー・売上Map・目標MapからランキングつきSalesPerson配列を構築 */
function buildSalesPeople(
  users: UserWithDepartment[],
  salesMap: Map<string, number>,
  targetMap: Map<string, number>,
  unit: string = 'MAN_YEN',
): SalesPerson[] {
  const salesPeople: SalesPerson[] = users.map((user) => {
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

/** 期間内の月別合計Mapを構築（0初期化つき） */
function buildMonthlyMap(
  startDate: Date,
  endDate: Date,
  records: SalesRecordWithUser[],
  aggregateField?: AggregateField,
): Map<string, number> {
  const map = new Map<string, number>();
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const r of records) {
    const d = new Date(r.recordDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  ): Promise<{ salesPeople: SalesPerson[]; recordCount: number }> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    const isCustomFieldAgg = !!parseCustomFieldId(aggregateField);
    const unit = await resolveAggregateUnit(
      tenantId,
      dataTypeId,
      aggregateField,
    );
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
  ): Promise<SalesPerson[]> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    const isCustomFieldAgg = !!parseCustomFieldId(aggregateField);
    const unit = await resolveAggregateUnit(
      tenantId,
      dataTypeId,
      aggregateField,
    );
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
    const periodStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );
    const periodEnd = new Date(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
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
      const dow = new Date(r.recordDate).getDay();
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
      const date = new Date(r.recordDate).getDate();
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

    const now = new Date();
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
      now.getFullYear(),
      now.getMonth() + 1,
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

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthSales = conv(monthlyMap.get(currentMonthKey) || 0);
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const remainingDays = daysInMonth - now.getDate();
    const landingPrediction =
      Math.round((currentMonthSales + remainingDays * dailyAvg) * 10) / 10;
    const landingMonth = `${String(now.getFullYear()).slice(2)}/${String(now.getMonth() + 1).padStart(2, '0')}`;

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
  ): Promise<RankingBoardData> {
    dataTypeId = await resolveEffectiveDataTypeId(tenantId, dataTypeId);
    // 月別カラムは常に「直近3ヶ月」固定(現在月 / 前月 / 2ヶ月前)
    const now = new Date();
    const recentMonthsEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const recentMonthsStart = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      1,
    );

    // TOTAL集計範囲と月別範囲のうち広いほうで一度だけDB取得し、filterで使い分け
    const fetchStart =
      startDate < recentMonthsStart ? startDate : recentMonthsStart;
    const fetchEnd = endDate > recentMonthsEnd ? endDate : recentMonthsEnd;

    const [users, allRecords] = await Promise.all([
      fetchUsers(tenantId, userIds),
      salesRecordRepository.findByPeriod(
        fetchStart,
        fetchEnd,
        tenantId,
        userIds,
        dataTypeId,
      ),
    ]);

    // 直近3ヶ月の月キー(降順)
    const monthKeys: string[] = [];
    const cursor = new Date(
      recentMonthsStart.getFullYear(),
      recentMonthsStart.getMonth(),
      1,
    );
    const end = new Date(
      recentMonthsEnd.getFullYear(),
      recentMonthsEnd.getMonth(),
      1,
    );
    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      monthKeys.push(`${y}-${String(m).padStart(2, '0')}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    monthKeys.reverse();

    const buildRanking = (records: SalesRecordWithUser[]): RankingMember[] => {
      const salesByUser = new Map<string, number>();
      for (const r of records) {
        salesByUser.set(
          r.userId,
          (salesByUser.get(r.userId) || 0) + getNumericValue(r, aggregateField),
        );
      }
      const ranked = users
        .map((m: UserWithDepartment) => ({
          name: m.name || '',
          imageUrl: m.imageUrl || undefined,
          amount: salesByUser.get(m.id) || 0,
        }))
        .filter((m: { amount: number }) => m.amount > 0)
        .sort(
          (a: { amount: number }, b: { amount: number }) => b.amount - a.amount,
        )
        .map(
          (
            m: { name: string; imageUrl?: string; amount: number },
            i: number,
          ) => ({
            rank: i + 1,
            ...m,
          }),
        );
      return ranked;
    };

    const monthColumns: RankingColumn[] = monthKeys.map((key) => {
      const [y, m] = key.split('-');
      const monthRecords = allRecords.filter((r: SalesRecordWithUser) => {
        const d = new Date(r.recordDate);
        return (
          d.getFullYear() === parseInt(y) && d.getMonth() + 1 === parseInt(m)
        );
      });
      return {
        label: `${y}/${m}`,
        isTotal: false,
        members: buildRanking(monthRecords),
      };
    });

    // TOTAL集計: 引数で指定された期間のレコードのみ
    const totalRecords = allRecords.filter((r: SalesRecordWithUser) => {
      const d = new Date(r.recordDate);
      return d >= startDate && d <= endDate;
    });
    const startLabel = `${String(startDate.getFullYear()).slice(2)}/${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const endLabel = `${String(endDate.getFullYear()).slice(2)}/${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    const totalColumn: RankingColumn = {
      label: 'TOTAL',
      subLabel: `${startLabel}〜${endLabel}`,
      isTotal: true,
      members: buildRanking(totalRecords),
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

    if (type === 'prev_month') {
      prevStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth() - 1,
        1,
      );
      prevEnd = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        0,
        23,
        59,
        59,
      );
    } else {
      prevStart = new Date(
        startDate.getFullYear() - 1,
        startDate.getMonth(),
        1,
      );
      prevEnd = new Date(
        endDate.getFullYear() - 1,
        endDate.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
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
   * 速報検出用: 今月のレコード総数 + 最新N件（dataType別unit変換済み）を返す。
   * 速報無効に設定されたデータ種別のレコードは除外し、
   * 各レコードにデータ種別ごとの message/videoId を含める。
   */
  async getBreakingNewsData(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    limit: number,
    userIds?: string[],
  ) {
    const [recordCount, latestRecordsRaw, breakingConfig] = await Promise.all([
      salesRecordRepository.countByPeriod(
        startDate,
        endDate,
        tenantId,
        userIds,
      ),
      // 除外の影響でN件に満たなくなる可能性があるため多めに取得
      salesRecordRepository.findLatest(
        tenantId,
        limit * 3,
        startDate,
        endDate,
        userIds,
      ),
      displayService.getBreakingNewsResolvedConfig(tenantId),
    ]);

    const { defaultMessage, defaultVideoId, perDataType } = breakingConfig;

    const latest = latestRecordsRaw
      .filter((r) => {
        // dataTypeId が存在しないレコードはデフォルト設定で表示（有効）
        if (r.dataTypeId === null || r.dataTypeId === undefined) return true;
        const pc = perDataType[r.dataTypeId];
        if (!pc) return true;
        return pc.enabled;
      })
      .slice(0, limit)
      .map((r) => {
        const unit = r.dataType?.unit || 'MAN_YEN';
        const pc =
          r.dataTypeId !== null && r.dataTypeId !== undefined
            ? perDataType[r.dataTypeId]
            : undefined;
        return {
          id: r.id,
          memberName: r.user.name || '',
          memberImageUrl: r.user.imageUrl || undefined,
          value: convertByUnit(r.value, unit),
          unit,
          dataTypeId: r.dataTypeId ?? null,
          dataTypeName: r.dataType?.name || '',
          breakingNewsMessage: pc?.message ?? defaultMessage,
          breakingNewsVideoId: pc?.videoId ?? defaultVideoId,
          createdAt: r.createdAt.toISOString(),
        };
      });

    return { recordCount, latest };
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
};
