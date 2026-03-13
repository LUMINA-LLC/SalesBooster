'use client';

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface TrendBarChartProps {
  data: {
    month: string;
    displayMonth: string;
    sales: number;
    movingAvg: number | null;
  }[];
  darkMode?: boolean;
}

export default function TrendBarChart({
  data,
  darkMode = false,
}: TrendBarChartProps) {
  return (
    <div
      className={`border rounded p-4 h-full flex flex-col ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
    >
      <h3
        className={`text-sm font-bold text-center mb-2 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
      >
        トレンド
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? '#374151' : '#e5e7eb'}
          />
          <XAxis
            dataKey="displayMonth"
            tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#374151' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#374151' }}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString()}万円`,
              name === 'sales' ? '売上' : '3ヶ月移動平均',
            ]}
            labelFormatter={(label) => label}
          />
          <Legend
            formatter={(value) =>
              value === 'sales' ? '推移' : '3ヶ月移動平均'
            }
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="sales" fill="#4F6DB5" radius={[2, 2, 0, 0]} />
          <Line
            dataKey="movingAvg"
            type="monotone"
            stroke="#94A3B8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
