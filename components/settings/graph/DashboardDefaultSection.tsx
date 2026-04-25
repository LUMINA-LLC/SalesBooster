'use client';

import { useEffect, useState } from 'react';
import {
  GraphConfig,
  DefaultViewSettings,
  PeriodGraphDefault,
  RangeGraphDefault,
  ReportDefault,
  RecordDefault,
} from '@/types/graph';
import type { DateRange } from '@/lib/dashboardDefault';
import PeriodGraphDefaultCard from './dashboardDefault/PeriodGraphDefaultCard';
import RangeGraphDefaultCard from './dashboardDefault/RangeGraphDefaultCard';
import ReportDefaultCard from './dashboardDefault/ReportDefaultCard';
import RecordDefaultCard from './dashboardDefault/RecordDefaultCard';

interface DashboardDefaultSectionProps {
  config: GraphConfig;
  onUpdate: <K extends keyof GraphConfig>(
    key: K,
    value: GraphConfig[K],
  ) => void;
}

type ViewTabKey =
  | 'PERIOD_GRAPH'
  | 'CUMULATIVE_GRAPH'
  | 'TREND_GRAPH'
  | 'REPORT'
  | 'RECORD';

const TABS: { key: ViewTabKey; label: string }[] = [
  { key: 'PERIOD_GRAPH', label: '期間グラフ' },
  { key: 'CUMULATIVE_GRAPH', label: '累計グラフ' },
  { key: 'TREND_GRAPH', label: '推移グラフ' },
  { key: 'REPORT', label: 'レポート' },
  { key: 'RECORD', label: 'レコード' },
];

export default function DashboardDefaultSection({
  config,
  onUpdate,
}: DashboardDefaultSectionProps) {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTabKey>('PERIOD_GRAPH');

  useEffect(() => {
    fetch('/api/sales/date-range')
      .then((res) => (res.ok ? res.json() : null))
      .then(setDateRange)
      .catch(() => setDateRange(null));
  }, []);

  const minDate = dateRange ? new Date(dateRange.minDate) : null;
  const maxDate = dateRange ? new Date(dateRange.maxDate) : null;

  const settings = config.defaultViewSettings ?? {};

  const updateView = <K extends keyof DefaultViewSettings>(
    key: K,
    value: DefaultViewSettings[K],
  ) => {
    onUpdate('defaultViewSettings', { ...settings, [key]: value });
  };

  const periodGraph: PeriodGraphDefault = settings.PERIOD_GRAPH ?? {
    unit: '月',
    dateLabel: '',
  };
  const cumulativeGraph: RangeGraphDefault = settings.CUMULATIVE_GRAPH ?? {
    mode: '単月',
  };
  const trendGraph: RangeGraphDefault = settings.TREND_GRAPH ?? {
    mode: '単月',
  };
  const report: ReportDefault = settings.REPORT ?? { month: '' };
  const record: RecordDefault = settings.RECORD ?? {
    startMonth: '',
    endMonth: '',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-1">
        ダッシュボード初期表示
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        ダッシュボード画面を開いたときの各グラフの初期表示状態です（ディスプレイモードには適用されません）
      </p>

      {/* タブ */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 選択タブの内容 */}
      {activeTab === 'PERIOD_GRAPH' && (
        <PeriodGraphDefaultCard
          value={periodGraph}
          onChange={(v) => updateView('PERIOD_GRAPH', v)}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
      {activeTab === 'CUMULATIVE_GRAPH' && (
        <RangeGraphDefaultCard
          label="累計グラフ"
          value={cumulativeGraph}
          onChange={(v) => updateView('CUMULATIVE_GRAPH', v)}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
      {activeTab === 'TREND_GRAPH' && (
        <RangeGraphDefaultCard
          label="推移グラフ"
          value={trendGraph}
          onChange={(v) => updateView('TREND_GRAPH', v)}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
      {activeTab === 'REPORT' && (
        <ReportDefaultCard
          value={report}
          onChange={(v) => updateView('REPORT', v)}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
      {activeTab === 'RECORD' && (
        <RecordDefaultCard
          value={record}
          onChange={(v) => updateView('RECORD', v)}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
    </div>
  );
}
