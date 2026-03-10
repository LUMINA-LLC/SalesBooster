'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SalesPerson, NumberBoardMetric, NUMBER_BOARD_METRIC_LABELS } from '@/types';
import { formatNumber } from '@/lib/currency';

interface NumberBoardProps {
  salesData: SalesPerson[];
  recordCount: number;
  metrics: NumberBoardMetric[];
  darkMode?: boolean;
}

interface MetricValue {
  label: string;
  value: number;
  suffix: string;
  format: (n: number) => string;
}

function useCountUp(target: number, duration: number = 1500): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const animate = useCallback((timestamp: number) => {
    if (startRef.current === null) {
      startRef.current = timestamp;
    }
    const elapsed = timestamp - startRef.current;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo for dramatic effect
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const value = startValueRef.current + (target - startValueRef.current) * eased;
    setCurrent(value);

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [target, duration]);

  useEffect(() => {
    startRef.current = null;
    startValueRef.current = 0;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, animate]);

  return current;
}

function CountUpValue({ value, suffix, format, darkMode }: { value: number; suffix: string; format: (n: number) => string; darkMode: boolean }) {
  const animatedValue = useCountUp(value);

  return (
    <div className="flex items-baseline justify-center gap-3">
      <span
        className={`font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
        style={{ fontSize: 'clamp(3rem, 12vw, 10rem)' }}
      >
        {format(animatedValue)}
      </span>
      {suffix && (
        <span
          className={`font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ fontSize: 'clamp(1.2rem, 4vw, 3rem)' }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function computeMetric(metric: NumberBoardMetric, salesData: SalesPerson[], recordCount: number): MetricValue {
  switch (metric) {
    case 'TOTAL_SALES': {
      const total = salesData.reduce((sum, p) => sum + p.sales, 0);
      return {
        label: NUMBER_BOARD_METRIC_LABELS.TOTAL_SALES,
        value: total,
        suffix: '万円',
        format: (n: number) => formatNumber(Math.round(n)),
      };
    }
    case 'TOTAL_COUNT':
      return {
        label: NUMBER_BOARD_METRIC_LABELS.TOTAL_COUNT,
        value: recordCount,
        suffix: '件',
        format: (n: number) => Math.round(n).toLocaleString(),
      };
    case 'AVG_ACHIEVEMENT': {
      const avg = salesData.length > 0
        ? salesData.reduce((sum, p) => sum + p.achievement, 0) / salesData.length
        : 0;
      return {
        label: NUMBER_BOARD_METRIC_LABELS.AVG_ACHIEVEMENT,
        value: avg,
        suffix: '%',
        format: (n: number) => n.toFixed(1),
      };
    }
    case 'TEAM_TARGET': {
      const totalTarget = salesData.reduce((sum, p) => sum + p.target, 0);
      return {
        label: NUMBER_BOARD_METRIC_LABELS.TEAM_TARGET,
        value: totalTarget,
        suffix: '万円',
        format: (n: number) => formatNumber(Math.round(n)),
      };
    }
  }
}

export default function NumberBoard({ salesData, recordCount, metrics, darkMode = false }: NumberBoardProps) {
  const displayMetrics = metrics.length > 0 ? metrics : ['TOTAL_SALES', 'TOTAL_COUNT'] as NumberBoardMetric[];
  const metricValues = displayMetrics.map((m) => computeMetric(m, salesData, recordCount));

  // Single metric: use maximum size, multiple: scale down
  const isSingle = metricValues.length === 1;

  return (
    <div className={`h-full flex flex-col items-center justify-center px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`flex flex-col ${isSingle ? 'gap-4' : 'gap-8'} items-center w-full max-w-5xl`}>
        {metricValues.map((mv, i) => (
          <div key={displayMetrics[i]} className="text-center w-full">
            {/* Label */}
            <div
              className={`font-semibold tracking-widest uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              style={{ fontSize: isSingle ? 'clamp(1rem, 3vw, 2rem)' : 'clamp(0.8rem, 2vw, 1.4rem)' }}
            >
              {mv.label}
            </div>
            {/* Value with count-up */}
            <CountUpValue
              value={mv.value}
              suffix={mv.suffix}
              format={mv.format}
              darkMode={darkMode}
            />
            {/* Divider between items */}
            {i < metricValues.length - 1 && (
              <div className={`mx-auto mt-6 w-24 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
