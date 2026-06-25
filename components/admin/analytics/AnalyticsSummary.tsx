'use client';

import type { AuditAnalytics } from '@/types/audit';

/** 分析の主要指標サマリーカード */
export default function AnalyticsSummary({
  data,
  showTenantCard = true,
}: {
  data: AuditAnalytics;
  /** 全テナント選択時のみ「アクティブテナント」カードを表示 */
  showTenantCard?: boolean;
}) {
  const { totalCount, tenantActivity, dailyActivity } = data;
  const days = dailyActivity.length || 1;
  const dailyAvg = Math.round(totalCount / days);
  const activeTenants = tenantActivity.filter(
    (t) => t.tenantId !== null,
  ).length;

  const cards = [
    { label: '総イベント数', value: totalCount.toLocaleString(), sub: '件' },
    { label: '日平均', value: dailyAvg.toLocaleString(), sub: '件/日' },
    ...(showTenantCard
      ? [
          {
            label: 'アクティブテナント',
            value: activeTenants,
            sub: '社',
          },
        ]
      : []),
  ];

  return (
    <div
      className={`grid grid-cols-2 gap-4 ${
        showTenantCard ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
      }`}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="text-xs font-medium text-gray-500">{c.label}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{c.value}</div>
          <div className="mt-0.5 text-xs text-gray-400">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
