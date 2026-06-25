'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { AuditAnalytics } from '@/types/audit';

/** テナント別アクティビティ（上位、横棒） */
export default function TenantActivityChart({
  data,
}: {
  data: AuditAnalytics['tenantActivity'];
}) {
  const TOP = 12;
  const top = data.slice(0, TOP);
  const rest = data.slice(TOP);
  const chartData = top.map((t) => ({ name: t.name, count: t.count }));
  if (rest.length > 0) {
    chartData.push({
      name: `その他（${rest.length}社）`,
      count: rest.reduce((s, r) => s + r.count, 0),
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">
        テナント別アクティビティ
      </h3>
      {chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">
          データがありません
        </p>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(240, chartData.length * 28)}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              width={120}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString()} 件`,
                '件数',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar
              dataKey="count"
              fill="#2193b0"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
