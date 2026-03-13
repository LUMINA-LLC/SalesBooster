'use client';

import { SalesPerson } from '@/types';
import { formatNumber } from '@/lib/currency';
import { getUnitLabel } from '@/lib/units';

interface MobileSalesChartProps {
  salesData: SalesPerson[];
  unit?: string;
}

export default function MobileSalesChart({ salesData, unit = 'MAN_YEN' }: MobileSalesChartProps) {
  if (salesData.length === 0) return null;

  const maxValue = Math.max(...salesData.map((p) => Math.max(p.sales, p.target)));
  const unitLabel = getUnitLabel(unit);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-3 pt-3 pb-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">売上グラフ</h3>
      </div>
      <div className="px-3 pb-3 overflow-x-auto">
        <div className="flex items-end gap-1 min-w-0" style={{ minHeight: 120 }}>
          {salesData.map((person) => {
            const barHeight = maxValue > 0 ? (person.sales / maxValue) * 100 : 0;
            const targetHeight = maxValue > 0 ? (person.target / maxValue) * 100 : 0;
            const isAchieved = person.achievement >= 100;

            return (
              <div
                key={person.name}
                className="flex flex-col items-center flex-1 min-w-[36px] max-w-[56px]"
              >
                {/* 金額 */}
                <span className="text-[10px] text-gray-500 mb-1 whitespace-nowrap">
                  {formatNumber(person.sales)}
                </span>

                {/* バー */}
                <div className="relative w-full flex justify-center" style={{ height: 100 }}>
                  {/* 目標ライン */}
                  {person.target > 0 && (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-orange-400 z-10"
                      style={{ bottom: `${targetHeight}%` }}
                    />
                  )}
                  {/* 実績バー */}
                  <div
                    className={`w-5 rounded-t transition-all duration-300 ${
                      isAchieved ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ height: `${barHeight}%`, marginTop: 'auto' }}
                  />
                </div>

                {/* 名前 */}
                <span className="text-[10px] text-gray-600 mt-1 truncate w-full text-center">
                  {person.name.length > 3 ? person.name.slice(0, 3) : person.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 px-3 pb-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />
          未達成
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
          達成
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-0 border-t-2 border-dashed border-orange-400" style={{ width: 10 }} />
          目標
        </span>
        <span className="text-gray-400">({unitLabel})</span>
      </div>
    </div>
  );
}
