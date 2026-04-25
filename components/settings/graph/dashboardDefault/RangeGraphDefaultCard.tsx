'use client';

import type { RangeGraphDefault } from '@/types/graph';
import { generateMonthYMs, ymToLabel } from '@/lib/dashboardDefault';

interface RangeGraphDefaultCardProps {
  label: string;
  value: RangeGraphDefault;
  onChange: (next: RangeGraphDefault) => void;
  minDate: Date | null;
  maxDate: Date | null;
}

export default function RangeGraphDefaultCard({
  label,
  value,
  onChange,
  minDate,
  maxDate,
}: RangeGraphDefaultCardProps) {
  const monthYMs = minDate && maxDate ? generateMonthYMs(minDate, maxDate) : [];

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center border border-gray-300 rounded bg-white">
          {(['単月', '期間'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...value, mode: m })}
              className={`px-3 py-1 text-sm ${
                value.mode === m
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${m === '期間' ? 'border-l border-gray-300' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>

        {value.mode === '単月' ? (
          <select
            value={value.month ?? ''}
            onChange={(e) => onChange({ ...value, month: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="">未設定</option>
            {monthYMs.map((ym) => (
              <option key={ym} value={ym}>
                {ymToLabel(ym)}
              </option>
            ))}
          </select>
        ) : (
          <>
            <select
              value={value.startMonth ?? ''}
              onChange={(e) =>
                onChange({ ...value, startMonth: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="">未設定</option>
              {monthYMs.map((ym) => (
                <option key={ym} value={ym}>
                  {ymToLabel(ym)}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">〜</span>
            <select
              value={value.endMonth ?? ''}
              onChange={(e) => onChange({ ...value, endMonth: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="">未設定</option>
              {monthYMs.map((ym) => (
                <option key={ym} value={ym}>
                  {ymToLabel(ym)}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
