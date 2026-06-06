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
import type { AuditAnalytics } from '@/types';

/** アクション種別ごとの件数（上位、横棒） */
export default function ActionBreakdownChart({
  data,
}: {
  data: AuditAnalytics['actionBreakdown'];
}) {
  // 上位12件まで表示（残りは「その他」に集約）
  const TOP = 12;
  const top = data.slice(0, TOP);
  const rest = data.slice(TOP);
  const chartData = [...top];
  if (rest.length > 0) {
    chartData.push({
      action: 'OTHER' as never,
      label: `その他（${rest.length}種）`,
      count: rest.reduce((s, r) => s + r.count, 0),
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">
        アクション別件数
      </h3>
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
            dataKey="label"
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
            fill="#f59e0b"
            radius={[0, 4, 4, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
