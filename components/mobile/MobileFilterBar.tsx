'use client';

import { useState, useEffect } from 'react';
import type { DataTypeInfo } from '@/types';

interface GroupOption {
  id: number;
  name: string;
}

interface MobileFilterBarProps {
  onMonthChange?: (year: number, month: number) => void;
  onGroupChange?: (groupId: string) => void;
  onDataTypeChange?: (dataTypeId: string, unit: string) => void;
  initialYear?: number;
  initialMonth?: number;
  initialGroupId?: string;
  initialDataTypeId?: string;
}

export default function MobileFilterBar({
  onMonthChange,
  onGroupChange,
  onDataTypeChange,
  initialYear,
  initialMonth,
  initialGroupId = '',
  initialDataTypeId = '',
}: MobileFilterBarProps) {
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [selectedDataTypeId, setSelectedDataTypeId] =
    useState(initialDataTypeId);

  // グループとデータ種類を取得
  useEffect(() => {
    fetch('/api/groups')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setGroups(data))
      .catch(() => setGroups([]));

    fetch('/api/data-types?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DataTypeInfo[]) => {
        setDataTypes(data);
        if (!initialDataTypeId) {
          const defaultType = data.find((dt) => dt.isDefault) ?? data[0];
          if (defaultType) {
            setSelectedDataTypeId(String(defaultType.id));
            onDataTypeChange?.(String(defaultType.id), defaultType.unit);
          }
        }
      })
      .catch(() => setDataTypes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initialYear/initialMonth が変わったら反映
  useEffect(() => {
    if (initialYear !== undefined) setYear(initialYear);
    if (initialMonth !== undefined) setMonth(initialMonth);
  }, [initialYear, initialMonth]);

  useEffect(() => {
    if (initialGroupId !== undefined) setSelectedGroupId(initialGroupId);
  }, [initialGroupId]);

  const goPrev = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };

  const goNext = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    onGroupChange?.(value);
  };

  const handleDataTypeChange = (dtId: string) => {
    setSelectedDataTypeId(dtId);
    const dt = dataTypes.find((d) => String(d.id) === dtId);
    if (dt) onDataTypeChange?.(dtId, dt.unit);
  };

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const goToCurrentMonth = () => {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    setYear(y);
    setMonth(m);
    onMonthChange?.(y, m);
  };

  const monthLabel = `${year}年${String(month).padStart(2, '0')}月`;

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      {/* 1行目: 月切替 + グループ */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* 月切替 */}
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="前月"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-800 min-w-[100px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={goNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="次月"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="ml-1 px-2 py-0.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 active:bg-blue-200 transition-colors"
            >
              今月
            </button>
          )}
        </div>

        {/* グループ選択 */}
        <select
          value={selectedGroupId}
          onChange={(e) => handleGroupChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-40 truncate"
        >
          <option value="">全体</option>
          {groups.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2行目: データ種類タブ（複数ある場合のみ） */}
      {dataTypes.length > 1 && (
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {dataTypes.map((dt) => (
            <button
              key={dt.id}
              onClick={() => handleDataTypeChange(String(dt.id))}
              className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedDataTypeId === String(dt.id)
                  ? 'text-white border-transparent'
                  : 'text-gray-600 border-gray-300 bg-white'
              }`}
              style={
                selectedDataTypeId === String(dt.id)
                  ? { backgroundColor: dt.color || '#3B82F6' }
                  : undefined
              }
            >
              {dt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
