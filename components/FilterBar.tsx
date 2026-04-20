'use client';

import { useState, useEffect, useRef } from 'react';
import GroupMemberSelector from './filter/GroupMemberSelector';
import GraphIconTabs from './filter/GraphIconTabs';
import ViewTabs from './filter/ViewTabs';
import PeriodUnitToggle from './filter/PeriodUnitToggle';
import PeriodNavigator, { PeriodSelection } from './filter/PeriodNavigator';
import { ViewType, PeriodUnit } from '@/types';
import type { DataTypeInfo } from '@/types';
import { DEFAULT_UNIT } from '@/types/units';

export type OverlayLineType = 'norma' | 'prev_month' | 'prev_year';

interface FilterBarProps {
  onViewChange?: (view: ViewType) => void;
  onFilterChange?: (filter: { groupId: string; memberId: string }) => void;
  onPeriodChange?: (period: PeriodSelection) => void;
  onDataTypeChange?: (dataTypeId: string, unit: string) => void;
  onOverlayLinesChange?: (lines: OverlayLineType[]) => void;
  initialView?: ViewType;
  initialPeriodUnit?: PeriodUnit;
}

export interface DateRange {
  minDate: string;
  maxDate: string;
}

const OVERLAY_LINE_OPTIONS: { value: OverlayLineType; label: string }[] = [
  { value: 'norma', label: 'ノルマ' },
  { value: 'prev_month', label: '前月平均' },
  { value: 'prev_year', label: '前年同月平均' },
];

export default function FilterBar({
  onViewChange,
  onFilterChange,
  onPeriodChange,
  onDataTypeChange,
  onOverlayLinesChange,
  initialView = 'PERIOD_GRAPH',
  initialPeriodUnit = '月',
}: FilterBarProps = {}) {
  const [selectedView, setSelectedView] = useState<ViewType>(initialView);
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(initialPeriodUnit);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [selectedDataTypeId, setSelectedDataTypeId] = useState('');
  const [overlayLines, setOverlayLines] = useState<OverlayLineType[]>([
    'norma',
  ]);
  const [overlayDropdownOpen, setOverlayDropdownOpen] = useState(false);

  // 外部からの初期値変更を反映（graphConfig ロード後の初期値同期用）
  const initialSyncedRef = useRef(false);
  useEffect(() => {
    if (initialSyncedRef.current) return;
    initialSyncedRef.current = true;
    setSelectedView(initialView);
    setPeriodUnit(initialPeriodUnit);
    if (onViewChange) onViewChange(initialView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView, initialPeriodUnit]);

  useEffect(() => {
    fetch('/api/sales/date-range')
      .then((res) => (res.ok ? res.json() : null))
      .then(setDateRange)
      .catch(() => setDateRange(null));

    fetch('/api/data-types?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DataTypeInfo[]) => {
        setDataTypes(data);
        const defaultType = data.find((dt) => dt.isDefault);
        const initialType = defaultType ?? data[0];
        const initialId = initialType ? String(initialType.id) : '';
        setSelectedDataTypeId(initialId);
        if (onDataTypeChange && initialType) {
          onDataTypeChange(initialId, initialType.unit);
        }
      })
      .catch(() => setDataTypes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewChange = (view: ViewType) => {
    setSelectedView(view);
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleDataTypeChange = (dtId: string) => {
    setSelectedDataTypeId(dtId);
    if (onDataTypeChange) {
      const dt = dataTypes.find((d) => String(d.id) === dtId);
      onDataTypeChange(dtId, dt?.unit ?? DEFAULT_UNIT);
    }
  };

  const handleOverlayToggle = (line: OverlayLineType) => {
    const next = overlayLines.includes(line)
      ? overlayLines.filter((l) => l !== line)
      : [...overlayLines, line];
    setOverlayLines(next);
    onOverlayLinesChange?.(next);
  };

  const showPeriodSelection =
    selectedView === 'CUMULATIVE_GRAPH' || selectedView === 'TREND_GRAPH';
  const hidePeriodControls = selectedView === 'RECORD';
  // 月/週/日の切替は期間グラフのみで意味を持つ
  const showPeriodUnitToggle = selectedView === 'PERIOD_GRAPH';
  const showOverlayLines =
    selectedView === 'PERIOD_GRAPH' || selectedView === 'CUMULATIVE_GRAPH';

  return (
    <div className="hidden md:block bg-gray-50 border-b border-gray-200">
      {/* 1段目: グループとメンバー + データ種類 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GroupMemberSelector onFilterChange={onFilterChange} />
            {/* データ種類セレクタ */}
            {dataTypes.length > 1 && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-600">データ種類</span>
                <div className="flex gap-1">
                  {dataTypes.map((dt) => (
                    <button
                      key={dt.id}
                      onClick={() => handleDataTypeChange(String(dt.id))}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        selectedDataTypeId === String(dt.id)
                          ? 'text-white border-transparent'
                          : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
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
              </div>
            )}
          </div>
          <GraphIconTabs />
        </div>
      </div>

      {/* 2段目: グラフ種類選択とその他のコントロール */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ViewTabs
              selectedView={selectedView}
              onViewChange={handleViewChange}
            />
            {!hidePeriodControls && (
              <>
                {showPeriodUnitToggle && (
                  <PeriodUnitToggle
                    periodUnit={periodUnit}
                    onPeriodUnitChange={setPeriodUnit}
                  />
                )}
                <PeriodNavigator
                  periodUnit={periodUnit}
                  showPeriodSelection={showPeriodSelection}
                  dateRange={dateRange}
                  onPeriodChange={onPeriodChange}
                />
              </>
            )}
          </div>

          {showOverlayLines && (
            <div className="relative">
              <button
                onClick={() => setOverlayDropdownOpen(!overlayDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16"
                  />
                </svg>
                <span className="text-gray-700">ライン表示</span>
                {overlayLines.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {overlayLines.length}
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${overlayDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {overlayDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOverlayDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    {OVERLAY_LINE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleOverlayToggle(opt.value)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            overlayLines.includes(opt.value)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {overlayLines.includes(opt.value) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">{opt.label}</span>
                        <div
                          className={`ml-auto w-6 h-0.5 ${
                            opt.value === 'norma'
                              ? 'bg-orange-500'
                              : opt.value === 'prev_month'
                                ? 'bg-emerald-500'
                                : 'bg-purple-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
