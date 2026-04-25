'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getUnitLabel } from '@/lib/units';
import { DEFAULT_UNIT } from '@/types/units';

interface CumulativeTrendChartProps {
  data: { month: string; displayMonth: string; cumulative: number }[];
  darkMode?: boolean;
  unit?: string;
}

export default function CumulativeTrendChart({
  data,
  darkMode = false,
  unit = DEFAULT_UNIT,
}: CumulativeTrendChartProps) {
  const unitLabel = getUnitLabel(unit);
  return (
    <div
      className={`border rounded p-4 h-full flex flex-col ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
    >
      <h3
        className={`text-sm font-bold text-center mb-2 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
      >
        積上げ推移
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
            tickFormatter={(v) => `${v.toLocaleString()}`}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString()}${unitLabel}`,
              '累計売上',
            ]}
            labelFormatter={(label) => label}
          />
          <Legend
            formatter={() => '累計売上'}
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            dataKey="cumulative"
            type="monotone"
            stroke={darkMode ? '#60a5fa' : '#1E40AF'}
            strokeWidth={2}
            dot={{ r: 3, fill: darkMode ? '#60a5fa' : '#1E40AF' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
