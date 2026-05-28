'use client';

import { useEffect, useRef, useState, RefObject } from 'react';
import { COLUMN_WIDTH } from '@/types/chart';

const MIN_GAP = 4;
const MAX_COLUMN_WIDTH = 160;

export interface ChartLayout {
  containerRef: RefObject<HTMLDivElement | null>;
  columnWidth: number;
  rowGap: number;
}

/**
 * 外側コンテナの実幅を計測し、メンバー数に応じてカラム幅と
 * カラム間ギャップ（= 両端パディングと等しい）を動的に算出する。
 *
 * - columnWidth: [COLUMN_WIDTH, MAX_COLUMN_WIDTH] でクランプ
 * - rowGap: 余った領域を (n+1) 個のギャップ（カラム間 + 両端）に均等分配
 */
export function useChartLayout(
  memberCount: number,
  labelWidth: number,
  isDisplayMode: boolean,
): ChartLayout {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveLabelWidth = isDisplayMode ? 0 : labelWidth;
  const usableWidth = Math.max(0, containerWidth - effectiveLabelWidth);
  const widthAtMinGap = Math.max(
    0,
    usableWidth - (memberCount + 1) * MIN_GAP,
  );
  const calculatedColumnWidth =
    memberCount > 0 ? widthAtMinGap / memberCount : COLUMN_WIDTH;
  const columnWidth = Math.min(
    MAX_COLUMN_WIDTH,
    Math.max(COLUMN_WIDTH, Math.floor(calculatedColumnWidth)),
  );
  const slack = Math.max(0, usableWidth - columnWidth * memberCount);
  const rowGap =
    memberCount > 0
      ? Math.max(MIN_GAP, Math.floor(slack / (memberCount + 1)))
      : MIN_GAP;

  return { containerRef, columnWidth, rowGap };
}
