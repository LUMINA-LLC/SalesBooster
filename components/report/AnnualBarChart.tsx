'use client';

import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
} from 'recharts';
import { ReportAnnualChart } from '@/types/report';
import { getUnitLabel } from '@/lib/units';

interface AnnualBarChartProps {
  chart: ReportAnnualChart;
  darkMode?: boolean;
}

export default function AnnualBarChart({
  chart,
  darkMode = false,
}: AnnualBarChartProps) {
  const unitLabel = getUnitLabel(chart.unit);
  return (
    <div
      className={`flex h-full min-h-0 flex-col rounded border p-4 ${
        darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      <h4
        className={`mb-2 shrink-0 text-center text-sm font-bold ${
          darkMode ? 'text-blue-400' : 'text-gray-700'
        }`}
      >
        {chart.dataTypeName}
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chart.months}
          margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
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
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString()}${unitLabel}`,
              name === 'thisYear' ? '今年' : '昨年',
            ]}
          />
          <Legend
            formatter={(value) => (value === 'thisYear' ? '今年' : '昨年')}
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="lastYear" fill="#CBD5E1" radius={[2, 2, 0, 0]} />
          <Bar dataKey="thisYear" fill="#F59E0B" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
