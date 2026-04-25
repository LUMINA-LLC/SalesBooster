'use client';

import { getUnitLabel } from '@/lib/units';
import { DEFAULT_UNIT } from '@/types/units';

interface StatsPanelProps {
  stats: {
    monthlyAvg: number;
    dailyAvg: number;
    targetDays: number;
    targetMonths: number;
    landingPrediction: number;
    landingMonth: string;
  };
  darkMode?: boolean;
  unit?: string;
}

export default function StatsPanel({
  stats,
  darkMode = false,
  unit = DEFAULT_UNIT,
}: StatsPanelProps) {
  const unitLabel = getUnitLabel(unit);
  const cardClass = darkMode
    ? 'bg-gray-800 border-gray-600'
    : 'bg-white border-gray-200';
  const titleClass = darkMode ? 'text-blue-400' : 'text-blue-600';
  const labelClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const valueClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const unitClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`border rounded p-4 h-full flex flex-col ${cardClass}`}>
      <h3
        className={`text-sm font-bold text-center mb-4 shrink-0 ${titleClass}`}
      >
        その他情報
      </h3>
      <div className="flex-1 flex flex-col justify-evenly">
        <div className="text-center">
          <div className={`text-xs ${labelClass}`}>月平均（直近3ヶ月）</div>
          <div className={`text-2xl font-bold ${valueClass}`}>
            {stats.monthlyAvg.toLocaleString()}
            <span className={`text-sm font-normal ${unitClass}`}>
              {unitLabel}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-xs ${labelClass}`}>一日平均（直近3ヶ月）</div>
          <div className={`text-2xl font-bold ${valueClass}`}>
            {stats.dailyAvg}
            <span className={`text-sm font-normal ${unitClass}`}>
              {unitLabel}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-xs ${labelClass}`}>
            目標達成必要日数/月数（直近3ヶ月）
          </div>
          <div className={`text-2xl font-bold ${valueClass}`}>
            {stats.targetDays}
            <span className={`text-sm font-normal ${unitClass}`}>日</span>
            {' / '}
            {stats.targetMonths}
            <span className={`text-sm font-normal ${unitClass}`}>ヶ月</span>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-xs ${labelClass}`}>
            今月 着地予測（{stats.landingMonth}）
          </div>
          <div className={`text-2xl font-bold ${valueClass}`}>
            {stats.landingPrediction.toLocaleString()}
            <span className={`text-sm font-normal ${unitClass}`}>
              {unitLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
