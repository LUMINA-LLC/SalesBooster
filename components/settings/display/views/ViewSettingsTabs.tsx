'use client';

import { useState } from 'react';
import { DisplayViewConfig } from '@/types/display';
import {
  AGGREGATION_UNIT_VIEW_TYPES,
  MIN_GROUPS_FOR_AGGREGATION_UNIT,
} from '@/const/salesView';
import { VIEW_PERIOD_CAPABILITIES } from '@/lib/displayPeriod';
import PeriodSelector from './PeriodSelector';
import DataTypeSelector from './DataTypeSelector';
import AggregatableFieldSelector from './AggregatableFieldSelector';
import AggregationUnitSelector from './AggregationUnitSelector';
import NumberBoardMetricSelector from './NumberBoardMetricSelector';
import MembersPerPageInput from './MembersPerPageInput';

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

interface ViewSettingsTabsProps {
  view: DisplayViewConfig;
  dataTypes: DataTypeOption[];
  /** テナントのグループ数（集計単位セレクタの表示判定に使用） */
  groupCount: number;
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

type TabKey = 'period' | 'data' | 'display';

const TAB_LABELS: Record<TabKey, string> = {
  period: '期間',
  data: 'データ',
  display: '表示',
};

/** 1ページ表示人数を持つビュー（=「表示」タブを出す） */
const PAGEABLE_VIEW_TYPES = new Set<string>([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
]);

/** データ種類セレクタを持つビュー */
const DATA_TYPE_VIEW_TYPES = new Set<string>([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
  'RECORD',
]);

/**
 * ビューごとの設定を「期間 / データ / 表示」のタブに整理して表示する。
 * そのビューが持つカテゴリのタブだけを出す。
 */
export default function ViewSettingsTabs({
  view,
  dataTypes,
  groupCount,
  onUpdate,
}: ViewSettingsTabsProps) {
  const vt = view.viewType;
  const hasMultipleDataTypes = dataTypes.length > 1;
  // 集計単位セレクタを出すか（推移以外 かつ グループ2件以上）
  const hasAggregationUnit =
    AGGREGATION_UNIT_VIEW_TYPES.has(vt) &&
    groupCount >= MIN_GROUPS_FOR_AGGREGATION_UNIT;

  // 各タブを表示するか判定
  const hasPeriod = !!VIEW_PERIOD_CAPABILITIES[vt];
  const hasData =
    (DATA_TYPE_VIEW_TYPES.has(vt) && hasMultipleDataTypes) ||
    vt === 'NUMBER_BOARD' ||
    hasAggregationUnit;
  const hasDisplay = PAGEABLE_VIEW_TYPES.has(vt);

  const tabs = (['period', 'data', 'display'] as TabKey[]).filter((t) =>
    t === 'period' ? hasPeriod : t === 'data' ? hasData : hasDisplay,
  );

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0] ?? 'period');

  // タブが1つも無いビュー（カスタムスライド等）は何も出さない
  if (tabs.length === 0) return null;

  // activeTab が現在の tabs に無い場合は先頭にフォールバック
  const current = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <div className="mt-2">
      {/* タブヘッダー（タブが2つ以上のときのみ表示） */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                current === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      <div className="pt-2">
        {current === 'period' && (
          <PeriodSelector view={view} onUpdate={onUpdate} />
        )}
        {current === 'data' && (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <DataTypeSelector
                view={view}
                dataTypes={dataTypes}
                onUpdate={onUpdate}
              />
              <AggregatableFieldSelector view={view} onUpdate={onUpdate} />
              <AggregationUnitSelector
                view={view}
                groupCount={groupCount}
                onUpdate={onUpdate}
              />
            </div>
            <NumberBoardMetricSelector
              view={view}
              dataTypes={dataTypes}
              onUpdate={onUpdate}
            />
          </div>
        )}
        {current === 'display' && (
          <MembersPerPageInput view={view} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}
