'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { AuditAnalytics } from '@/types';

/** MM/DD 形式の短縮ラベル */
function shortDate(date: string): string {
  const [, m, d] = date.split('-');
  return `${m}/${d}`;
}

/** 日別イベント件数の推移（エリアチャート） */
export default function DailyActivityChart({
  data,
}: {
  data: AuditAnalytics['dailyActivity'];
}) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">
        日別アクティビティ推移
      </h3>
      {chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">
          データがありません
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2193b0" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2193b0" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString()} 件`,
                '件数',
              ]}
              labelFormatter={(l) => `${l}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#2193b0"
              strokeWidth={2}
              fill="url(#dailyFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
