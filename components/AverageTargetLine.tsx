'use client';

import React from 'react';
import { DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel } from '@/lib/units';

export interface OverlayLine {
  value: number;
  label: string;
  color: string; // border/text color class (e.g. 'orange-500')
  borderStyle?: string; // 'solid' | 'dashed'
}

interface AverageTargetLineProps {
  averageTarget: number;
  maxSales: number;
  overlayLines?: OverlayLine[];
  unit?: string;
}

const COLOR_MAP: Record<string, { border: string; text: string; bg: string }> =
  {
    'orange-500': {
      border: 'border-orange-500',
      text: 'text-orange-600',
      bg: 'bg-white',
    },
    'emerald-500': {
      border: 'border-emerald-500',
      text: 'text-emerald-600',
      bg: 'bg-white',
    },
    'purple-500': {
      border: 'border-purple-500',
      text: 'text-purple-600',
      bg: 'bg-white',
    },
  };

export default function AverageTargetLine({
  averageTarget,
  maxSales,
  overlayLines = [],
  unit = DEFAULT_UNIT,
}: AverageTargetLineProps) {
  if (maxSales <= 0) return null;

  const lines: OverlayLine[] = [];

  // 既存のノルマライン（後方互換）
  if (averageTarget > 0) {
    lines.push({
      value: averageTarget,
      label: '目標平均',
      color: 'orange-500',
      borderStyle: 'solid',
    });
  }

  // 追加のオーバーレイライン
  lines.push(...overlayLines.filter((l) => l.value > 0));

  if (lines.length === 0) return null;

  return (
    <>
      {lines.map((line, i) => {
        const colors = COLOR_MAP[line.color] || COLOR_MAP['orange-500'];
        const topPercent = 55 + (1 - line.value / maxSales) * 35;
        const isDashed = line.borderStyle === 'dashed';

        return (
          <div
            key={`${line.label}-${i}`}
            className={`absolute left-0 right-0 ${colors.border} z-10`}
            style={{
              top: `${topPercent}%`,
              borderTopWidth: '2px',
              borderTopStyle: isDashed ? 'dashed' : 'solid',
            }}
          >
            <div
              className={`absolute left-2 -top-3 text-xs ${colors.text} ${colors.bg} px-1 whitespace-nowrap`}
            >
              {line.label}
            </div>
            <div
              className={`absolute left-2 top-1 text-xs font-bold ${colors.text} ${colors.bg} px-1`}
            >
              {line.value}
              {getUnitLabel(unit)}
            </div>
            <div
              className={`absolute right-2 -top-3 text-xs ${colors.text} ${colors.bg} px-1 whitespace-nowrap`}
            >
              {line.label}
            </div>
            <div
              className={`absolute right-2 top-1 text-xs font-bold ${colors.text} ${colors.bg} px-1`}
            >
              {line.value}
              {getUnitLabel(unit)}
            </div>
          </div>
        );
      })}
    </>
  );
}
