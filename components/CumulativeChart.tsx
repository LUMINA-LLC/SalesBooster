'use client';

import Image from 'next/image';
import AverageTargetLine, { OverlayLine } from './AverageTargetLine';
import SalesBar from './SalesBar';
import ChartRow, { ChartCell } from './sales-performance/ChartRow';
import { useChartLayout } from '@/hooks/sales-performance/useChartLayout';
import { useZoneBoundaries } from '@/hooks/sales-performance/useZoneBoundaries';
import { SalesPerson } from '@/types';
import { DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel, formatNumber } from '@/lib/units';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';

interface CumulativeChartProps {
  salesData: SalesPerson[];
  darkMode?: boolean;
  showNormaLine?: boolean;
  overlayLines?: OverlayLine[];
  unit?: string;
  graphConfig?: GraphConfig;
}

export default function CumulativeChart({
  salesData,
  darkMode = false,
  showNormaLine = true,
  overlayLines = [],
  unit = DEFAULT_UNIT,
  graphConfig = DEFAULT_GRAPH_CONFIG,
}: CumulativeChartProps) {
  // ランキング表示件数制限を適用
  const limitedData =
    graphConfig.rankingLimit && graphConfig.rankingLimit > 0
      ? salesData.slice(0, graphConfig.rankingLimit)
      : salesData;

  const maxSales =
    limitedData.length > 0
      ? Math.max(...limitedData.map((person) => person.sales))
      : 0;

  // TOP 20%, CENTER, LOW 20%の境界を計算
  const top20Index = Math.ceil(limitedData.length * 0.2);
  const low20Index = Math.floor(limitedData.length * 0.8);

  // 目標平均の計算（メンバーの目標値の平均）
  const averageTarget =
    limitedData.length > 0
      ? Math.round(
          limitedData.reduce((sum, person) => sum + person.target, 0) /
            limitedData.length,
        )
      : 0;

  // CumulativeChart は左サマリ列を持たないため labelWidth=0 / isDisplayMode=true
  const { containerRef, columnWidth, rowGap } = useChartLayout(
    limitedData.length,
    0,
    true,
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
      className={`mx-6 my-4 shadow-sm overflow-x-auto h-[calc(100%-2rem)] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ minWidth: 'fit-content' }}
      >
        {/* グラフエリア */}
        <div className="relative py-6 flex-1 min-h-0">
          <AverageTargetLine
            averageTarget={showNormaLine ? averageTarget : 0}
            maxSales={maxSales}
            overlayLines={overlayLines}
            unit={unit}
          />
          {/* ラベル表示 */}
          <div className="absolute top-4 left-0 right-0 flex justify-between px-12">
            <div className="text-xs text-blue-600 bg-blue-50 border border-blue-400 px-3 py-1">
              TOP 20%
            </div>
            <div className="text-xs text-gray-600 bg-gray-100 border border-gray-400 px-3 py-1">
              CENTER
            </div>
            <div className="text-xs text-orange-600 bg-orange-50 border border-orange-400 px-3 py-1">
              LOW 20%
            </div>
          </div>

          {/* グラフバー */}
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
                  unit={unit}
                  graphConfig={graphConfig}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 順位行 */}
        <ChartRow
          labelWidth={0}
          rowGap={rowGap}
          isDisplayMode={true}
          darkMode={darkMode}
          className={`border-t border-b ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
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
          labelWidth={0}
          rowGap={rowGap}
          isDisplayMode={true}
          darkMode={darkMode}
          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
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
          labelWidth={0}
          rowGap={rowGap}
          isDisplayMode={true}
          darkMode={darkMode}
          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
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
                className={`text-sm font-bold mt-1 ${
                  person.achievement >= 100
                    ? 'text-red-600'
                    : person.achievement >= 80
                      ? 'text-blue-600'
                      : darkMode
                        ? 'text-gray-400'
                        : 'text-gray-600'
                }`}
              >
                {person.achievement}%
              </div>
            </ChartCell>
          ))}
        </ChartRow>

        {/* 目標行 */}
        <ChartRow
          labelWidth={0}
          rowGap={rowGap}
          isDisplayMode={true}
          darkMode={darkMode}
          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
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
