'use client';

import { useState } from 'react';
import { ReportSummary, ReportPeriodKey } from '@/types';
import AnnualBarChart from './AnnualBarChart';
import PeriodPanel from './PeriodPanel';

interface ReportViewProps {
  summary: ReportSummary;
  darkMode?: boolean;
}

/** 平均タブの選択肢（今月パネルの右側） */
const AVERAGE_TABS: { key: ReportPeriodKey; label: string }[] = [
  { key: 'prevMonth', label: '先月' },
  { key: 'avg3m', label: '過去3ヶ月平均' },
  { key: 'avg6m', label: '過去6ヶ月平均' },
  { key: 'avg1y', label: '過去1年平均' },
];

export default function ReportView({
  summary,
  darkMode = false,
}: ReportViewProps) {
  const [avgTab, setAvgTab] = useState<ReportPeriodKey>('avg3m');

  const current = summary.periods.find((p) => p.periodKey === 'current');
  const avgPeriod = summary.periods.find((p) => p.periodKey === avgTab);

  return (
    <div
      className={`mx-6 my-4 flex h-[calc(100%-2rem)] flex-col gap-4 overflow-auto rounded-2xl p-5 shadow-sm ring-1 ${
        darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-100'
      }`}
    >
      {/* 上段: 今月 + 平均タブパネル（コンテンツ分の高さ） */}
      <div className="shrink-0">
        <h3 className="mb-2 inline-block rounded-md bg-[#2193b0] px-3 py-1 text-sm font-bold text-white">
          月別状況
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {current && <PeriodPanel title={current.label} period={current} />}
          {avgPeriod && (
            <PeriodPanel
              title={avgPeriod.label}
              period={avgPeriod}
              rightSlot={
                <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
                  {AVERAGE_TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setAvgTab(t.key)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        avgTab === t.key
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* 下段: データ種類ごとの年間棒グラフ（残り高さを使い、グラフは自動フィット） */}
      <div className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-2 inline-block shrink-0 self-start rounded-md bg-[#2193b0] px-3 py-1 text-sm font-bold text-white">
          年間データ
        </h3>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2 xl:grid-rows-2">
          {summary.annualCharts.map((chart) => (
            <AnnualBarChart
              key={chart.dataTypeId}
              chart={chart}
              darkMode={darkMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
