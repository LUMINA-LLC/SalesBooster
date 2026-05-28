'use client';

import Image from 'next/image';
import PerformanceLabels from '@/components/PerformanceLabels';
import AverageTargetLine, {
  OverlayLine,
} from '@/components/AverageTargetLine';
import SalesBar from '@/components/SalesBar';
import ChartRow, { ChartCell } from './ChartRow';
import { useChartLayout } from '@/hooks/sales-performance/useChartLayout';
import { useZoneBoundaries } from '@/hooks/sales-performance/useZoneBoundaries';
import { SalesPerson } from '@/types';
import { DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel, formatNumber } from '@/lib/units';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';

interface SalesPerformanceProps {
  salesData: SalesPerson[];
  recordCount: number;
  darkMode?: boolean;
  isDisplayMode?: boolean;
  showNormaLine?: boolean;
  overlayLines?: OverlayLine[];
  unit?: string;
  /** データ種別名 (ラベル「最高{name}」「{name}計」表示用) */
  dataTypeName?: string;
  graphConfig?: GraphConfig;
}

const LABEL_WIDTH = 120;

export default function SalesPerformance({
  salesData,
  recordCount,
  darkMode = false,
  isDisplayMode = false,
  showNormaLine = true,
  overlayLines = [],
  unit = DEFAULT_UNIT,
  dataTypeName,
  graphConfig = DEFAULT_GRAPH_CONFIG,
}: SalesPerformanceProps) {
  const displayName = dataTypeName || '売上';

  // ランキング表示件数制限を適用（売上降順で上位N名）
  const limitedData =
    graphConfig.rankingLimit && graphConfig.rankingLimit > 0
      ? [...salesData]
          .sort((a, b) => b.sales - a.sales)
          .slice(0, graphConfig.rankingLimit)
      : salesData;

  const averageTarget =
    limitedData.length > 0
      ? Math.round(
          limitedData.reduce((sum, person) => sum + person.target, 0) /
            limitedData.length,
        )
      : 0;

  const maxSales =
    limitedData.length > 0
      ? Math.max(...limitedData.map((person) => person.sales))
      : 0;

  // TOP 20%, CENTER, LOW 20%の境界を計算
  const top20Index = Math.ceil(limitedData.length * 0.2);
  const low20Index = Math.floor(limitedData.length * 0.8);

  const totalSales = limitedData.reduce((sum, person) => sum + person.sales, 0);

  const { containerRef, columnWidth, rowGap } = useChartLayout(
    limitedData.length,
    LABEL_WIDTH,
    isDisplayMode,
  );

  const { hasTopBoundary, hasLowBoundary, boundary1, boundary2 } =
    useZoneBoundaries(
      limitedData.length,
      top20Index,
      low20Index,
      columnWidth,
      rowGap,
    );

  return (
    <div
      ref={containerRef}
      className={`mx-6 my-4 rounded-2xl shadow-sm ring-1 relative overflow-x-auto h-[calc(100%-2rem)] flex flex-col ${darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-100'}`}
    >
      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ minWidth: 'fit-content' }}
      >
        {/* グラフエリア */}
        <div className="flex flex-1 min-h-0">
          {!isDisplayMode && (
            <div
              className={`shrink-0 sticky left-0 z-40 border-r flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
              style={{ width: `${LABEL_WIDTH}px` }}
            >
              <div className="flex flex-col justify-between h-full py-6 w-full">
                <div className="px-2 text-center">
                  <div
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    最高{displayName}
                  </div>
                  <div
                    className={`text-lg font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                  >
                    {formatNumber(maxSales)}
                    <span
                      className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {getUnitLabel(unit)}
                    </span>
                  </div>
                  <div
                    className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="text-xs text-blue-600">
                      チーム計
                    </div>
                    <div className="text-lg font-bold text-blue-700 mt-1">
                      {formatNumber(totalSales)}
                      <span className="text-sm font-normal text-blue-500">
                        {getUnitLabel(unit)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div
                      className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      データ登録件数
                    </div>
                    <div
                      className={`text-lg font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                    >
                      {recordCount}
                      <span
                        className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        件
                      </span>
                    </div>
                  </div>
                </div>
                {showNormaLine && averageTarget > 0 && (
                  <div className="px-2 text-center">
                    <div className="text-xs text-orange-600">ノルマライン</div>
                    <div className="text-lg font-bold text-orange-600 mt-1">
                      {formatNumber(averageTarget)}
                      <span className="text-sm font-normal text-orange-500">
                        {getUnitLabel(unit)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="relative py-6 flex-1 min-h-0">
            <PerformanceLabels />
            <AverageTargetLine
              averageTarget={showNormaLine ? averageTarget : 0}
              maxSales={maxSales}
              overlayLines={overlayLines}
              unit={unit}
            />
            <div className="absolute bottom-0 left-0 right-0 top-20">
              {/* ゾーン背景: TOP / CENTER / LOW を 3 つの連続した帯として塗る。
                  カラム間のギャップや両端の余白もゾーンの色で埋まる。
                  帯の境界はゾーン境界線（カラム間ギャップの中央）と一致させる。 */}
              {hasTopBoundary && (
                <div
                  className={`absolute top-0 bottom-0 left-0 pointer-events-none ${
                    darkMode ? 'bg-amber-900/10' : 'bg-amber-50/80'
                  }`}
                  style={{ width: `${boundary1}px` }}
                />
              )}
              {hasLowBoundary && (
                <div
                  className={`absolute top-0 bottom-0 right-0 pointer-events-none ${
                    darkMode ? 'bg-teal-900/10' : 'bg-teal-50/80'
                  }`}
                  style={{ left: `${boundary2}px` }}
                />
              )}
              {hasTopBoundary && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10"
                  style={{
                    left: `${boundary1}px`,
                    borderLeft: `2px dashed ${darkMode ? 'rgba(251, 191, 36, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                />
              )}
              {hasLowBoundary && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10"
                  style={{
                    left: `${boundary2}px`,
                    borderLeft: `2px dashed ${darkMode ? 'rgba(20, 184, 166, 0.4)' : 'rgba(13, 148, 136, 0.4)'}`,
                  }}
                />
              )}
              <div
                className="relative h-full flex"
                style={{
                  gap: `${rowGap}px`,
                  paddingLeft: `${rowGap}px`,
                  paddingRight: `${rowGap}px`,
                }}
              >
                {limitedData.map((person, index) => (
                  <SalesBar
                    key={person.name}
                    person={person}
                    index={index}
                    maxSales={maxSales}
                    top20Index={top20Index}
                    low20Index={low20Index}
                    columnWidth={columnWidth}
                    changed={false}
                    unit={unit}
                    graphConfig={graphConfig}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 順位行 */}
        <ChartRow
          labelWidth={LABEL_WIDTH}
          rowGap={rowGap}
          isDisplayMode={isDisplayMode}
          darkMode={darkMode}
          className={`border-t border-b ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
          labelClassName={darkMode ? 'bg-gray-700!' : 'bg-gray-50!'}
          label={
            <div
              className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              順位
            </div>
          }
        >
          {limitedData.map((person) => (
            <ChartCell
              key={person.name}
              columnWidth={columnWidth}
              className="text-center py-2"
            >
              <div
                className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
              >
                {person.rank}位
              </div>
            </ChartCell>
          ))}
        </ChartRow>

        {/* メンバー行 */}
        <ChartRow
          labelWidth={LABEL_WIDTH}
          rowGap={rowGap}
          isDisplayMode={isDisplayMode}
          darkMode={darkMode}
          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          label={
            <div
              className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              メンバー
            </div>
          }
        >
          {limitedData.map((person, index) => (
            <ChartCell
              key={person.name}
              columnWidth={columnWidth}
              className="flex flex-col items-center py-2"
            >
              <div className="relative mb-1.5 w-full px-2">
                <div className="relative w-full aspect-square rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm">
                  {person.imageUrl ? (
                    <Image
                      src={person.imageUrl}
                      alt={person.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                      <span className="text-white text-xs font-bold">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                {index < top20Index && person.achievement >= 100 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div
                className={`text-[9px] text-center font-medium leading-tight px-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
              >
                {person.name}
              </div>
              {person.department && (
                <div
                  className={`text-[8px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {person.department}
                </div>
              )}
            </ChartCell>
          ))}
        </ChartRow>

        {/* 実績・達成率行 */}
        <ChartRow
          labelWidth={LABEL_WIDTH}
          rowGap={rowGap}
          isDisplayMode={isDisplayMode}
          darkMode={darkMode}
          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          label={
            <div className="text-center">
              <div
                className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                実績
              </div>
              <div
                className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                達成率
              </div>
            </div>
          }
        >
          {limitedData.map((person) => (
            <ChartCell
              key={person.name}
              columnWidth={columnWidth}
              className="text-center py-2"
            >
              <div
                className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
              >
                {formatNumber(person.sales)}
                {getUnitLabel(unit)}
              </div>
              <div
                className={`text-sm font-bold mt-1 ${person.achievement >= 100 ? 'text-red-600' : person.achievement >= 80 ? 'text-blue-600' : 'text-gray-600'}`}
              >
                {person.achievement}%
              </div>
            </ChartCell>
          ))}
        </ChartRow>

        {/* 目標行 */}
        <ChartRow
          labelWidth={LABEL_WIDTH}
          rowGap={rowGap}
          isDisplayMode={isDisplayMode}
          darkMode={darkMode}
          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          label={
            <div
              className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              目標
            </div>
          }
        >
          {limitedData.map((person) => (
            <ChartCell
              key={person.name}
              columnWidth={columnWidth}
              className="text-center py-2"
            >
              <div
                className={`text-[11px] font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {formatNumber(person.target)}
                {getUnitLabel(unit)}
              </div>
            </ChartCell>
          ))}
        </ChartRow>
      </div>
    </div>
  );
}
