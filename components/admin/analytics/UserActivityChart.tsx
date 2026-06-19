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

/** ユーザー別アクティビティ（上位、横棒） */
export default function UserActivityChart({
  data,
}: {
  data: AuditAnalytics['userActivity'];
}) {
  const TOP = 15;
  const chartData = data.slice(0, TOP).map((u) => ({
    name: u.name,
    count: u.count,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">
        ユーザー別アクティビティ（上位{TOP}）
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
              width={140}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString()} 件`,
                '操作数',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar
              dataKey="count"
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
