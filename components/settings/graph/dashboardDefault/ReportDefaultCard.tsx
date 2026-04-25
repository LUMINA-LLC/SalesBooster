'use client';

import type { ReportDefault } from '@/types/graph';
import { generateMonthYMs, ymToLabel } from '@/lib/dashboardDefault';

interface ReportDefaultCardProps {
  value: ReportDefault;
  onChange: (next: ReportDefault) => void;
  minDate: Date | null;
  maxDate: Date | null;
}

export default function ReportDefaultCard({
  value,
  onChange,
  minDate,
  maxDate,
}: ReportDefaultCardProps) {
  const monthYMs = minDate && maxDate ? generateMonthYMs(minDate, maxDate) : [];

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">レポート</div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value.month}
          onChange={(e) => onChange({ month: e.target.value })}
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
