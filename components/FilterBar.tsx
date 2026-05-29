'use client';

import { useState, useEffect, useRef } from 'react';
import GroupMemberSelector from './filter/GroupMemberSelector';
import GraphIconTabs from './filter/GraphIconTabs';
import ViewTabs from './filter/ViewTabs';
import PeriodUnitToggle from './filter/PeriodUnitToggle';
import PeriodNavigator, { PeriodSelection } from './filter/PeriodNavigator';
import Button from './common/Button';
import Select from './common/Select';
import { ViewType, PeriodUnit } from '@/types';
import type { DataTypeInfo } from '@/types';
import { DEFAULT_UNIT } from '@/types/units';
import type { DefaultViewSettings } from '@/types/graph';
import type {
  GroupOption,
  MemberOption,
  AggregatableFieldOption,
} from '@/hooks/useDashboardInit';

export type OverlayLineType = 'norma' | 'prev_month' | 'prev_year';

interface FilterBarProps {
  /** ダッシュボード初期マスターデータ（useDashboardInit で取得し page から渡す） */
  groups: GroupOption[];
  members: MemberOption[];
  dateRange: DateRange | null;
  dataTypes: DataTypeInfo[];
  /** 初期 data-type の集計対象カスタムフィールド（初期表示時のみ利用） */
  initialAggregatableFields: AggregatableFieldOption[];
  onViewChange?: (view: ViewType) => void;
  onFilterChange?: (filter: { groupId: string; memberId: string }) => void;
  onPeriodChange?: (period: PeriodSelection) => void;
  onDataTypeChange?: (dataTypeId: string, unit: string, name: string) => void;
  onOverlayLinesChange?: (lines: OverlayLineType[]) => void;
  onAggregateFieldChange?: (aggregateField: string, unit: string) => void;
  defaultViewSettings?: DefaultViewSettings;
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
  groups,
  members,
  dateRange,
  dataTypes,
  initialAggregatableFields,
  onViewChange,
  onFilterChange,
  onPeriodChange,
  onDataTypeChange,
  onOverlayLinesChange,
  onAggregateFieldChange,
  defaultViewSettings,
}: FilterBarProps) {
  const [selectedView, setSelectedView] = useState<ViewType>('PERIOD_GRAPH');
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(
    (defaultViewSettings?.PERIOD_GRAPH?.unit as PeriodUnit) ?? '月',
  );
  const [selectedDataTypeId, setSelectedDataTypeId] = useState('');
  const [overlayLines, setOverlayLines] = useState<OverlayLineType[]>([
    'norma',
  ]);
  const [overlayDropdownOpen, setOverlayDropdownOpen] = useState(false);
  const [aggregatableFields, setAggregatableFields] = useState<
    AggregatableFieldOption[]
  >(initialAggregatableFields);
  const [aggregateField, setAggregateField] = useState<string>('value');

  // data-types マスター取得（page から props で受領）後に初期データ種類を確定し、親へ通知する。
  // 初期 dataType の集計対象フィールドは props（initialAggregatableFields）を利用するため
  // ここでは custom-fields の fetch は行わない。
  const initialDataTypeApplied = useRef(false);
  useEffect(() => {
    if (initialDataTypeApplied.current) return;
    if (dataTypes.length === 0) return;
    initialDataTypeApplied.current = true;

    const defaultType = dataTypes.find((dt) => dt.isDefault);
    const initialType = defaultType ?? dataTypes[0];
    const initialId = initialType ? String(initialType.id) : '';
    setSelectedDataTypeId(initialId);
    if (onDataTypeChange && initialType) {
      onDataTypeChange(initialId, initialType.unit, initialType.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataTypes]);

  // props の初期集計フィールドが（マスター取得完了で）更新されたら state に反映。
  // ユーザーが dataType を切り替えた後は下の useEffect が fetch で上書きする。
  useEffect(() => {
    if (initialDataTypeApplied.current) return;
    setAggregatableFields(initialAggregatableFields);
  }, [initialAggregatableFields]);

  const handleViewChange = (view: ViewType) => {
    setSelectedView(view);
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // ユーザーが手動でデータ種類を切り替えたか（切替後は custom-fields を再 fetch する）
  const userChangedDataType = useRef(false);

  const handleDataTypeChange = (dtId: string) => {
    userChangedDataType.current = true;
    setSelectedDataTypeId(dtId);
    const dt = dataTypes.find((d) => String(d.id) === dtId);
    const dtUnit = dt?.unit ?? DEFAULT_UNIT;
    const dtName = dt?.name ?? '';
    if (onDataTypeChange) {
      onDataTypeChange(dtId, dtUnit, dtName);
    }
    // データ種類が変わったら集計値はメイン値にリセット
    setAggregateField('value');
    onAggregateFieldChange?.('value', dtUnit);
  };

  const handleAggregateFieldChange = (value: string) => {
    setAggregateField(value);
    if (value === 'value') {
      const dt = dataTypes.find((d) => String(d.id) === selectedDataTypeId);
      onAggregateFieldChange?.(value, dt?.unit ?? DEFAULT_UNIT);
    } else {
      const cfId = value.startsWith('cf_') ? value.slice(3) : '';
      const cf = aggregatableFields.find((f) => String(f.id) === cfId);
      onAggregateFieldChange?.(value, cf?.unit ?? DEFAULT_UNIT);
    }
  };

  // 選択中データ種類の集計対象カスタムフィールド一覧を取得。
  // 初期表示時は props（initialAggregatableFields）を使うため fetch せず、
  // ユーザーがデータ種類を切り替えた後のみ再取得する。
  useEffect(() => {
    if (!userChangedDataType.current) return;
    if (!selectedDataTypeId) {
      setAggregatableFields([]);
      return;
    }
    fetch(
      `/api/custom-fields?aggregatable=true&dataTypeId=${selectedDataTypeId}`,
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AggregatableFieldOption[]) => {
        setAggregatableFields(Array.isArray(data) ? data : []);
      })
      .catch(() => setAggregatableFields([]));
  }, [selectedDataTypeId]);

  const handleOverlayToggle = (line: OverlayLineType) => {
    const next = overlayLines.includes(line)
      ? overlayLines.filter((l) => l !== line)
      : [...overlayLines, line];
    setOverlayLines(next);
    onOverlayLinesChange?.(next);
  };

  const showPeriodSelection =
    selectedView === 'CUMULATIVE_GRAPH' ||
    selectedView === 'TREND_GRAPH' ||
    selectedView === 'RECORD';
  // RECORDビューは常に「期間選択のみ」(単月UIは出さない)
  const forcePeriodOnly = selectedView === 'RECORD';
  const hidePeriodControls = false;
  // 月/週/日の切替は期間グラフのみで意味を持つ
  const showPeriodUnitToggle = selectedView === 'PERIOD_GRAPH';
  const showOverlayLines =
    selectedView === 'PERIOD_GRAPH' || selectedView === 'CUMULATIVE_GRAPH';

  return (
    <div className="hidden md:block bg-white border-b border-gray-200">
      {/* 1段目: グループとメンバー + データ種類 */}
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <GroupMemberSelector
              groups={groups}
              allMembers={members}
              onFilterChange={onFilterChange}
            />
            {/* データ種類セレクタ */}
            {dataTypes.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">データ種類</label>
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
                  {dataTypes.map((dt) => (
                    <Button
                      key={dt.id}
                      label={dt.name}
                      variant="ghost"
                      color="indigo"
                      size="sm"
                      isActive={selectedDataTypeId === String(dt.id)}
                      onClick={() => handleDataTypeChange(String(dt.id))}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* 集計値セレクタ (集計対象カスタムフィールドが1つ以上ある場合のみ表示) */}
            {aggregatableFields.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">集計値</label>
                <Select
                  value={aggregateField}
                  onChange={handleAggregateFieldChange}
                  options={[
                    { value: 'value', label: 'メイン値' },
                    ...aggregatableFields.map((f) => ({
                      value: `cf_${f.id}`,
                      label: f.name,
                    })),
                  ]}
                />
              </div>
            )}
          </div>
          <GraphIconTabs />
        </div>
      </div>

      {/* 2段目: グラフ種類選択とその他のコントロール */}
      <div className="px-6 py-2.5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                  forcePeriodOnly={forcePeriodOnly}
                  dateRange={dateRange}
                  onPeriodChange={onPeriodChange}
                  selectedView={selectedView}
                  defaultViewSettings={defaultViewSettings}
                />
              </>
            )}
          </div>

          {showOverlayLines && (
            <div className="relative">
              <Button
                variant="outline"
                color="gray"
                size="sm"
                onClick={() => setOverlayDropdownOpen(!overlayDropdownOpen)}
                icon={
                  <svg
                    className="w-3.5 h-3.5 text-gray-400"
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
                }
                label={
                  overlayLines.length > 0
                    ? `ライン表示 (${overlayLines.length})`
                    : 'ライン表示'
                }
              />
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
