'use client';

import type { PeriodGraphDefault } from '@/types/graph';
import { generateDateOptions } from '@/lib/dashboardDefault';

interface PeriodGraphDefaultCardProps {
  value: PeriodGraphDefault;
  onChange: (next: PeriodGraphDefault) => void;
  minDate: Date | null;
  maxDate: Date | null;
}

export default function PeriodGraphDefaultCard({
  value,
  onChange,
  minDate,
  maxDate,
}: PeriodGraphDefaultCardProps) {
  const options =
    minDate && maxDate ? generateDateOptions(minDate, maxDate, value.unit) : [];

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">期間グラフ</div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center border border-gray-300 rounded bg-white">
          {(['月', '週', '日'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onChange({ unit: u, dateLabel: '' })}
              className={`px-3 py-1 text-sm ${
                value.unit === u
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${u !== '月' ? 'border-l border-gray-300' : ''}`}
            >
              {u}
            </button>
          ))}
        </div>
        <select
          value={value.dateLabel}
          onChange={(e) => onChange({ ...value, dateLabel: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">未設定</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
