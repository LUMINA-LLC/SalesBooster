'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

interface PieChartProps {
  data: { name: string; value: number; ratio: number }[];
  title: string;
  darkMode?: boolean;
}

export default function PieChart({
  data,
  title,
  darkMode = false,
}: PieChartProps) {
  const filteredData = data.filter((d) => d.value > 0);

  return (
    <div
      className={`border rounded p-4 h-full flex flex-col ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
    >
      <h3
        className={`text-sm font-bold text-center mb-2 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
      >
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={filteredData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, payload }) => `${name} ${payload?.ratio ?? 0}%`}
            fill={darkMode ? '#f3f4f6' : '#374151'}
            labelLine={{ strokeWidth: 1 }}
            fontSize={11}
            isAnimationActive={false}
          >
            {filteredData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString()}万円`,
              name,
            ]}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
