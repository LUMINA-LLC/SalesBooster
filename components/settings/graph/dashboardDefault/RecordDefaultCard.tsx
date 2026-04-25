'use client';

import type { RecordDefault } from '@/types/graph';
import { generateMonthYMs, ymToLabel } from '@/lib/dashboardDefault';

interface RecordDefaultCardProps {
  value: RecordDefault;
  onChange: (next: RecordDefault) => void;
  minDate: Date | null;
  maxDate: Date | null;
}

export default function RecordDefaultCard({
  value,
  onChange,
  minDate,
  maxDate,
}: RecordDefaultCardProps) {
  const monthYMs = minDate && maxDate ? generateMonthYMs(minDate, maxDate) : [];

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">
        レコード（期間）
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value.startMonth}
          onChange={(e) => onChange({ ...value, startMonth: e.target.value })}
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
          value={value.endMonth}
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
      </div>
    </div>
  );
}
