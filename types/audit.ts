import type { AuditAction } from '@prisma/client';

/** SUPER_ADMIN 向け監査ログ分析データ（1リクエストで全分析を返す） */
export interface AuditAnalytics {
  /** 集計対象の期間 */
  range: { startDate: string; endDate: string };
  /** 総イベント件数 */
  totalCount: number;
  /** 日別イベント件数の推移 */
  dailyActivity: { date: string; count: number }[];
  /** アクション種別ごとの件数（多い順） */
  actionBreakdown: { action: AuditAction; label: string; count: number }[];
  /** テナント別イベント件数（多い順） */
  tenantActivity: { tenantId: number | null; name: string; count: number }[];
  /** 時間帯×曜日のヒートマップ（day:0=日〜6=土, hour:0〜23, JST） */
  hourlyHeatmap: { day: number; hour: number; count: number }[];
  /** ユーザー別アクティビティ（多い順） */
  userActivity: { userId: string; name: string; count: number }[];
  /** ログイン時IP別アクセス件数（多い順）。ipAddress はログイン系イベントのみ記録 */
  ipAccess: { ip: string; count: number }[];
}
