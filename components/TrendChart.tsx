'use client';

import React, { useRef, useState, useEffect } from 'react';

interface MonthlyData {
  month: string;
  sales: number;
  displayMonth: string; // 表示用の月（例: "10月"）
}

interface TrendChartProps {
  monthlyData: MonthlyData[];
  title?: string;
  darkMode?: boolean;
}

export default function TrendChart({
  monthlyData,
  title = 'チーム売上推移',
  darkMode = false,
}: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // タイトル(約40px) + 凡例(約50px) + パディング(48px) を差し引き
        const available = containerRef.current.clientHeight - 138;
        setContainerHeight(Math.max(200, available));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 最大値と最小値を取得
  const maxSales =
    monthlyData.length > 0 ? Math.max(...monthlyData.map((d) => d.sales)) : 0;
  const minSales =
    monthlyData.length > 0 ? Math.min(...monthlyData.map((d) => d.sales)) : 0;

  // グラフの高さ範囲（パディング含む）
  const graphHeight = containerHeight;
  const graphPadding = 40;
  const effectiveHeight = graphHeight - graphPadding * 2;

  // Y軸のスケール計算
  const yScale = (value: number) => {
    const range = maxSales - minSales;
    if (range === 0) return graphPadding + effectiveHeight / 2;
    const normalized = (value - minSales) / range;
    return graphPadding + effectiveHeight * (1 - normalized);
  };

  // X軸の位置計算
  const xScale = (index: number) => {
    const graphWidth =
      monthlyData.length > 1 ? (monthlyData.length - 1) * 100 : 100;
    return 60 + (index / (monthlyData.length - 1 || 1)) * graphWidth;
  };

  // 折れ線のパスを生成
  const linePath = monthlyData
    .map((data, index) => {
      const x = xScale(index);
      const y = yScale(data.sales);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // SVGの全体幅を計算
  const svgWidth = Math.max(800, monthlyData.length * 100 + 120);

  return (
    <div
      ref={containerRef}
      className={`mx-6 my-4 shadow-sm overflow-x-auto h-[calc(100%-2rem)] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="p-6 flex-1 min-h-0 flex flex-col">
        {/* タイトル */}
        <h2
          className={`text-lg font-bold mb-4 shrink-0 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
        >
          {title}
        </h2>

        {/* グラフエリア */}
        <div
          className="relative flex-1 min-h-0"
          style={{ minWidth: `${svgWidth}px` }}
        >
          <svg
            width={svgWidth}
            height={graphHeight + 60}
            className="overflow-visible"
          >
            {/* グリッドライン */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = minSales + (maxSales - minSales) * ratio;
              const y = yScale(value);
              return (
                <g key={ratio}>
                  <line
                    x1={50}
                    y1={y}
                    x2={svgWidth - 40}
                    y2={y}
                    stroke={darkMode ? '#374151' : '#e5e7eb'}
                    strokeWidth={1}
                  />
                  <text
                    x={30}
                    y={y + 4}
                    fontSize={11}
                    fill={darkMode ? '#9ca3af' : '#6b7280'}
                    textAnchor="end"
                  >
                    {Math.round(value).toLocaleString()}万円
                  </text>
                </g>
              );
            })}

            {/* 折れ線グラフ */}
            <path
              d={linePath}
              fill="none"
              stroke={darkMode ? '#60a5fa' : '#1E40AF'}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* データポイント */}
            {monthlyData.map((data, index) => {
              const x = xScale(index);
              const y = yScale(data.sales);

              return (
                <g key={index}>
                  {/* ポイントの円 */}
                  <circle
                    cx={x}
                    cy={y}
                    r={5}
                    fill={darkMode ? '#60a5fa' : '#1E40AF'}
                    stroke={darkMode ? '#1f2937' : 'white'}
                    strokeWidth={2}
                  />

                  {/* 値のラベル */}
                  <text
                    x={x}
                    y={y - 12}
                    fontSize={11}
                    fill={darkMode ? '#93c5fd' : '#1E40AF'}
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {data.sales.toLocaleString()}万円
                  </text>

                  {/* 月のラベル */}
                  <text
                    x={x}
                    y={graphHeight + 20}
                    fontSize={11}
                    fill={darkMode ? '#9ca3af' : '#6b7280'}
                    textAnchor="middle"
                  >
                    {data.displayMonth}
                  </text>

                  {/* 日付のラベル */}
                  <text
                    x={x}
                    y={graphHeight + 35}
                    fontSize={10}
                    fill={darkMode ? '#6b7280' : '#9ca3af'}
                    textAnchor="middle"
                  >
                    {data.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 凡例 */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm shrink-0">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-0.5 ${darkMode ? 'bg-blue-400' : 'bg-blue-900'}`}
            ></div>
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              月間 （日次）
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-0.5 ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
            ></div>
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              月間 （累計）
            </span>
            <span
              className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              (0万円)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
