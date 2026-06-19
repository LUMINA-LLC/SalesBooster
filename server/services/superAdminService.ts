import { hash } from 'bcryptjs';
import { superAdminRepository } from '../repositories/superAdminRepository';
import { toJstParts } from '../lib/dateUtils';
import { AUDIT_ACTION_LABELS } from '@/const/audit';
import type { AuditAnalytics } from '@/types/audit';

/** Date を JST の "YYYY-MM-DD" 文字列に変換（チャートのX軸キー用） */
function jstDateKey(date: Date): string {
  const p = toJstParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** start〜end（JST日付）の全日付を YYYY-MM-DD で列挙し、count=0 で初期化 */
function buildDateSkeleton(startDate: Date, endDate: Date): string[] {
  const days: string[] = [];
  // JST 日付の重複を避けるため 1 日ずつ進める（UTC基準で加算しても JST 日付は単調増加）
  const cursor = new Date(startDate);
  let guard = 0;
  while (cursor <= endDate && guard < 1000) {
    days.push(jstDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard++;
  }
  // 末尾（endDate当日）が漏れる場合に補完
  const endKey = jstDateKey(endDate);
  if (days[days.length - 1] !== endKey) days.push(endKey);
  return Array.from(new Set(days));
}

export const superAdminService = {
  async getAll() {
    return superAdminRepository.findAll();
  },

  async create(data: { email: string; password: string; name?: string }) {
    const existing = await superAdminRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('DUPLICATE_EMAIL');
    }

    const hashedPassword = await hash(data.password, 12);
    return superAdminRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name || null,
    });
  },

  async update(
    id: string,
    data: { email?: string; password?: string; name?: string; status?: string },
  ) {
    const existing = await superAdminRepository.findById(id);
    if (!existing) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    const updateData: Record<string, unknown> = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password) {
      updateData.password = await hash(data.password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('NO_UPDATE_DATA');
    }

    return superAdminRepository.update(id, updateData);
  },

  async delete(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error('CANNOT_DELETE_SELF');
    }

    const existing = await superAdminRepository.findById(id);
    if (!existing) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    await superAdminRepository.delete(id);
  },

  async getAuditLogs(options: {
    page: number;
    limit: number;
    tenantId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const skip = (options.page - 1) * options.limit;

    const [logs, total] = await Promise.all([
      superAdminRepository.findAllAuditLogs({
        skip,
        take: options.limit,
        tenantId: options.tenantId,
        action: options.action,
        startDate: options.startDate,
        endDate: options.endDate,
      }),
      superAdminRepository.countAuditLogs({
        tenantId: options.tenantId,
        action: options.action,
        startDate: options.startDate,
        endDate: options.endDate,
      }),
    ]);

    return {
      data: logs,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  },

  /** 監査ログの各種分析を 1 リクエストで集計して返す */
  async getAuditAnalytics(options: {
    tenantId?: number;
    startDate: Date;
    endDate: Date;
  }): Promise<AuditAnalytics> {
    const [actionGroups, tenantGroups, createdAts, userGroups, ipGroups] =
      await Promise.all([
        superAdminRepository.groupByAction(options),
        superAdminRepository.groupByTenant(options),
        superAdminRepository.findCreatedAtsForDaily(options),
        superAdminRepository.groupByUser(options),
        superAdminRepository.groupByLoginIp(options),
      ]);

    // --- アクション別件数（多い順） ---
    const actionBreakdown = actionGroups
      .map((g) => ({
        action: g.action,
        label: AUDIT_ACTION_LABELS[g.action] ?? g.action,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const totalCount = actionBreakdown.reduce((s, a) => s + a.count, 0);

    // --- テナント別件数（多い順、名前解決） ---
    const tenantIds = tenantGroups
      .map((g) => g.tenantId)
      .filter((id): id is number => id !== null);
    const tenants = await superAdminRepository.findTenantNames(tenantIds);
    const nameMap = new Map(tenants.map((t) => [t.id, t.name]));
    const tenantActivity = tenantGroups
      .map((g) => ({
        tenantId: g.tenantId,
        name:
          g.tenantId === null
            ? 'システム/管理者'
            : (nameMap.get(g.tenantId) ?? `テナント#${g.tenantId}`),
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    // --- 日別推移（JST、歯抜け日0埋め） ---
    const skeleton = buildDateSkeleton(options.startDate, options.endDate);
    const dailyCounts = new Map<string, number>(skeleton.map((d) => [d, 0]));
    for (const r of createdAts) {
      const key = jstDateKey(r.createdAt);
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    }
    const dailyActivity = skeleton.map((date) => ({
      date,
      count: dailyCounts.get(date) ?? 0,
    }));

    // --- 時間帯×曜日ヒートマップ（JST、7曜日×24時間=168セルを0埋め） ---
    const heatCounts = new Map<string, number>();
    for (const r of createdAts) {
      const p = toJstParts(r.createdAt);
      // JST の曜日を求める（toJstParts は日付要素のみのため Date 経由で算出）
      const jst = new Date(r.createdAt.getTime() + 9 * 60 * 60 * 1000);
      const day = jst.getUTCDay(); // 0=日〜6=土
      const cellKey = `${day}-${p.hour}`;
      heatCounts.set(cellKey, (heatCounts.get(cellKey) ?? 0) + 1);
    }
    const hourlyHeatmap: AuditAnalytics['hourlyHeatmap'] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        hourlyHeatmap.push({
          day,
          hour,
          count: heatCounts.get(`${day}-${hour}`) ?? 0,
        });
      }
    }

    // --- ユーザー別アクティビティ（多い順、名前解決） ---
    const userIds = userGroups
      .map((g) => g.userId)
      .filter((id): id is string => id !== null);
    const users = await superAdminRepository.findUserNames(userIds);
    const userMap = new Map(users.map((u) => [u.id, u.name || u.email]));
    const userActivity = userGroups
      .filter((g): g is typeof g & { userId: string } => g.userId !== null)
      .map((g) => ({
        userId: g.userId,
        name: userMap.get(g.userId) ?? `ユーザー#${g.userId.slice(0, 8)}`,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    // --- ログイン時IP別アクセス（多い順） ---
    const ipAccess = ipGroups
      .filter(
        (g): g is typeof g & { ipAddress: string } => g.ipAddress !== null,
      )
      .map((g) => ({ ip: g.ipAddress, count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    return {
      range: {
        startDate: jstDateKey(options.startDate),
        endDate: jstDateKey(options.endDate),
      },
      totalCount,
      dailyActivity,
      actionBreakdown,
      tenantActivity,
      hourlyHeatmap,
      userActivity,
      ipAccess,
    };
  },
};
