import { salesRecordRepository } from '../repositories/salesRecordRepository';
import { memberRepository } from '../repositories/memberRepository';
import { targetRepository } from '../repositories/targetRepository';
import { dataTypeRepository } from '../repositories/dataTypeRepository';
import { customFieldRepository } from '../repositories/customFieldRepository';
import { displayService } from './displayService';
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
        return formatJstMonthKey(new Date(r.recordDate)) === key;
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
