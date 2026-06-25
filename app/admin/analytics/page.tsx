'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuditAnalytics } from '@/types/audit';
import AnalyticsSummary from '@/components/admin/analytics/AnalyticsSummary';
import DailyActivityChart from '@/components/admin/analytics/DailyActivityChart';
import ActionBreakdownChart from '@/components/admin/analytics/ActionBreakdownChart';
import TenantActivityChart from '@/components/admin/analytics/TenantActivityChart';
import HourlyHeatmap from '@/components/admin/analytics/HourlyHeatmap';
import UserActivityChart from '@/components/admin/analytics/UserActivityChart';
import IpAccessChart from '@/components/admin/analytics/IpAccessChart';

interface Tenant {
  id: number;
  name: string;
}

/** 期間プリセット（直近N日） */
const RANGE_PRESETS = [
  { label: '直近7日', days: 7 },
  { label: '直近30日', days: 30 },
  { label: '直近90日', days: 90 },
];

/** JST の YYYY-MM-DD を返す */
function jstDateStr(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AuditAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // フィルタ
  const [presetDays, setPresetDays] = useState(30);
  const [filterTenantId, setFilterTenantId] = useState('');

  useEffect(() => {
    fetch('/api/tenants')
      .then((res) => res.json())
      .then((d) => setTenants(Array.isArray(d) ? d : (d?.data ?? [])))
      .catch(() => {});
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date(end.getTime() - (presetDays - 1) * 86400000);
      const params = new URLSearchParams({
        startDate: jstDateStr(start),
        endDate: jstDateStr(end),
      });
      if (filterTenantId) params.set('tenantId', filterTenantId);

      const res = await fetch(`/api/admin/analytics?${params}`);
      if (!res.ok) {
        setError('分析データの取得に失敗しました');
        return;
      }
      setData(await res.json());
    } catch {
      setError('分析データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [presetDays, filterTenantId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">行動分析</h2>
        {data && (
          <span className="text-sm text-gray-500">
            {data.range.startDate} 〜 {data.range.endDate} ／ 総
            {data.totalCount.toLocaleString()} 件
          </span>
        )}
      </div>

      {/* フィルタ */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">期間</span>
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPresetDays(p.days)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  presetDays === p.days
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">テナント</span>
          <select
            value={filterTenantId}
            onChange={(e) => setFilterTenantId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="">全テナント</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <AnalyticsSummary data={data} showTenantCard={!filterTenantId} />

          <DailyActivityChart data={data.dailyActivity} />

          <HourlyHeatmap data={data.hourlyHeatmap} />

          {/* テナント別は全テナント選択時のみ表示。絞り込み時はアクション別を単独表示 */}
          {!filterTenantId ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ActionBreakdownChart data={data.actionBreakdown} />
              <TenantActivityChart data={data.tenantActivity} />
            </div>
          ) : (
            <ActionBreakdownChart data={data.actionBreakdown} />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <UserActivityChart data={data.userActivity} />
            <IpAccessChart data={data.ipAccess} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
