'use client';

import { ReportData } from '@/types';
import { DEFAULT_UNIT } from '@/types/units';
import TrendBarChart from './TrendBarChart';
import CumulativeTrendChart from './CumulativeTrendChart';
import PieChart from './PieChart';
import StatsPanel from './StatsPanel';

interface ReportViewProps {
  reportData: ReportData;
  darkMode?: boolean;
  unit?: string;
}

export default function ReportView({
  reportData,
  darkMode = false,
  unit = DEFAULT_UNIT,
}: ReportViewProps) {
  const dayOfWeekPieData = reportData.dayOfWeekRatio.map((d) => ({
    name: d.day,
    value: d.amount,
    ratio: d.ratio,
  }));

  const periodPieData = reportData.periodRatio.map((d) => ({
    name: d.period,
    value: d.amount,
    ratio: d.ratio,
  }));

  return (
    <div className="mx-6 my-4 h-[calc(100%-2rem)]">
      <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
        {/* 上段 */}
        <TrendBarChart
          data={reportData.monthlyTrend}
          darkMode={darkMode}
          unit={unit}
        />
        <CumulativeTrendChart
          data={reportData.cumulativeTrend}
          darkMode={darkMode}
          unit={unit}
        />
        <StatsPanel stats={reportData.stats} darkMode={darkMode} unit={unit} />
        {/* 下段 */}
        <PieChart
          data={dayOfWeekPieData}
          title="曜日 比率"
          darkMode={darkMode}
          unit={unit}
        />
        <PieChart
          data={periodPieData}
          title="前中後 比率"
          darkMode={darkMode}
          unit={unit}
        />
      </div>
    </div>
  );
}
