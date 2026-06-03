'use client';

import { useState } from 'react';
import { SalesPerson } from '@/types';
import { DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel, formatNumber } from '@/lib/units';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';
import {
  buildBarColorSet,
  getRankColor,
  getBarStyleProps,
} from '@/lib/graphStyle';

interface SalesBarProps {
  person: SalesPerson;
  index: number;
  maxSales: number;
  top20Index: number;
  low20Index: number;
  columnWidth: number;
  changed?: boolean;
  unit?: string;
  graphConfig?: GraphConfig;
}

export default function SalesBar({
  person,
  index,
  maxSales,
  top20Index,
  low20Index,
  columnWidth,
  changed,
  unit = DEFAULT_UNIT,
  graphConfig = DEFAULT_GRAPH_CONFIG,
}: SalesBarProps) {
  const [hovered, setHovered] = useState(false);

  const barHeight = maxSales > 0 ? (person.sales / maxSales) * 100 : 0;

  const rankColor = getRankColor(index, top20Index, low20Index, graphConfig);
  const colors = buildBarColorSet(rankColor, graphConfig);
  const styleProps = getBarStyleProps(graphConfig.barStyle);
  const cylinderWidth = columnWidth - 20;

  return (
    <div
      className="flex-1 h-full flex flex-col justify-end items-center"
      style={{ minWidth: `${columnWidth}px`, maxWidth: `${columnWidth}px` }}
    >
      {/* 円柱バー */}
      {person.sales > 0 && (
        <div
          className={`relative flex flex-col items-center${changed ? ' animate-bar-power' : ''}`}
          style={{
            height: `${barHeight}%`,
            minHeight: '50px',
            width: `${cylinderWidth}px`,
            transition: 'height 2s cubic-bezier(0.22, 1.2, 0.36, 1)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* ホバー時ツールチップ（円柱右側・上部に固定） */}
          {hovered && (
            <div
              className="absolute z-40 whitespace-nowrap pointer-events-none"
              style={{ left: 'calc(100% + 12px)', top: 0 }}
            >
              <div className="rounded-lg bg-gray-900/95 text-white px-3 py-2 shadow-xl ring-1 ring-black/10 text-left">
                <div className="text-sm font-bold mb-1">{person.name}</div>
                <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-[11px]">
                  <span className="text-gray-400">順位</span>
                  <span className="font-semibold text-right">
                    {person.rank}位
                  </span>
                  <span className="text-gray-400">実績</span>
                  <span className="font-semibold text-right">
                    {formatNumber(person.sales)}
                    {getUnitLabel(unit)}
                  </span>
                  <span className="text-gray-400">達成率</span>
                  <span
                    className={`font-semibold text-right ${
                      person.achievement >= 100
                        ? 'text-red-400'
                        : person.achievement >= 80
                          ? 'text-blue-400'
                          : 'text-gray-200'
                    }`}
                  >
                    {person.achievement}%
                  </span>
                  <span className="text-gray-400">目標</span>
                  <span className="font-semibold text-right">
                    {formatNumber(person.target)}
                    {getUnitLabel(unit)}
                  </span>
                </div>
              </div>
              {/* 吹き出しの三角（左向き・円柱を指す） */}
              <div
                className="absolute w-0 h-0"
                style={{
                  right: '100%',
                  top: '12px',
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '6px solid rgba(17, 24, 39, 0.95)',
                }}
              />
            </div>
          )}

          {/* 売上金額バッジ */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 z-30 whitespace-nowrap"
            style={{ top: '-28px' }}
          >
            <div
              className={`px-2 py-1 rounded-full text-white font-bold text-xs shadow-lg${changed ? ' animate-badge-burst' : ''}`}
              style={{
                background: colors.main,
                boxShadow: changed
                  ? `0 4px 20px ${colors.main}, 0 0 30px ${colors.main}90`
                  : `0 2px 8px ${colors.main}80`,
                transition: 'box-shadow 0.5s ease',
              }}
            >
              {formatNumber(person.sales)}
              {getUnitLabel(unit)}
            </div>
          </div>

          {/* 上部の楕円（蓋）- CYLINDER のみ */}
          {styleProps.showCylinderCap && (
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{
                height: '14px',
                background: colors.topGradient,
                borderRadius: '50%',
                transform: 'translateY(-7px)',
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15)',
                filter: hovered ? 'brightness(1.12)' : 'brightness(1)',
                transition: 'filter 0.2s ease',
              }}
            />
          )}

          {/* 円柱の本体 */}
          <div
            className="absolute inset-0"
            style={{
              background: colors.gradient,
              boxShadow: colors.glow,
              borderRadius: styleProps.borderRadius,
              filter: hovered ? 'brightness(1.12)' : 'brightness(1)',
              transition: 'filter 0.2s ease',
            }}
          />

          {/* サムアップアイコン（TOP 20%のみ） */}
          {index < top20Index && (
            <div
              className="absolute left-1/2 transform -translate-x-1/2 z-20"
              style={{ top: '50%', marginTop: '-20px' }}
            >
              <svg
                className="w-10 h-10 text-white drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
