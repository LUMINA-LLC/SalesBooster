'use client';

import { useState, useEffect, useRef } from 'react';
import {
  SalesPerson,
  NumberBoardMetric,
  NUMBER_BOARD_METRIC_LABELS,
  DataTypeInfo,
} from '@/types';
import { NumberBoardMetricConfig } from '@/types/display';
import { formatNumber } from '@/lib/currency';
import { DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel } from '@/lib/units';

interface NumberBoardProps {
  salesData: SalesPerson[];
  recordCount: number;
  metrics: NumberBoardMetric[];
  metricConfigs?: NumberBoardMetricConfig[];
  darkMode?: boolean;
  unit?: string;
  dataTypes?: DataTypeInfo[];
  filter?: { groupId: string; memberId: string };
}

interface MetricValue {
  label: string;
  value: number;
  suffix: string;
  format: (n: number) => string;
}

/** メトリクスごとに異なるdataTypeIdが設定されているかチェック */
function getUniqueDataTypeIds(
  metricConfigs: NumberBoardMetricConfig[] | undefined,
): string[] {
  if (!metricConfigs) return [];
  const ids = new Set<string>();
  for (const c of metricConfigs) {
    if (c.dataTypeId) ids.add(c.dataTypeId);
  }
  return Array.from(ids);
}

function useCountUp(target: number, duration: number = 1500): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const animateRef = useRef<((timestamp: number) => void) | undefined>(
    undefined,
  );

  useEffect(() => {
    animateRef.current = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for dramatic effect
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value =
        startValueRef.current + (target - startValueRef.current) * eased;
      setCurrent(value);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame((ts) =>
          animateRef.current?.(ts),
        );
      }
    };
  }, [target, duration]);

  useEffect(() => {
    startRef.current = null;
    startValueRef.current = 0;
    frameRef.current = requestAnimationFrame((ts) => animateRef.current?.(ts));

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target]);

  return current;
}

function CountUpValue({
  value,
  suffix,
  format,
  darkMode,
}: {
  value: number;
  suffix: string;
  format: (n: number) => string;
  darkMode: boolean;
}) {
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

/** メトリクスごとのunitを解決 */
function resolveMetricUnit(
  metric: NumberBoardMetric,
  metricConfigs: NumberBoardMetricConfig[] | undefined,
  dataTypes: DataTypeInfo[] | undefined,
  defaultUnit: string,
): string {
  const conf = metricConfigs?.find((c) => c.metric === metric);
  if (conf?.dataTypeId && dataTypes) {
    const dt = dataTypes.find((d) => String(d.id) === conf.dataTypeId);
    if (dt) return dt.unit;
  }
  return defaultUnit;
}

function computeMetric(
  metric: NumberBoardMetric,
  salesData: SalesPerson[],
  recordCount: number,
  unit: string,
): MetricValue {
  const unitLabel = getUnitLabel(unit);
  switch (metric) {
    case 'TOTAL_SALES': {
      const total = salesData.reduce((sum, p) => sum + p.sales, 0);
      return {
        label: NUMBER_BOARD_METRIC_LABELS.TOTAL_SALES,
        value: total,
        suffix: unitLabel,
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
      const avg =
        salesData.length > 0
          ? salesData.reduce((sum, p) => sum + p.achievement, 0) /
            salesData.length
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
        suffix: unitLabel,
        format: (n: number) => formatNumber(Math.round(n)),
      };
    }
  }
}

/** メトリクスごとに異なるdataTypeIdのデータを個別取得するhook */
function usePerMetricData(
  metricConfigs: NumberBoardMetricConfig[] | undefined,
  filter: { groupId: string; memberId: string } | undefined,
) {
  const [dataMap, setDataMap] = useState<
    Record<string, { salesData: SalesPerson[]; recordCount: number }>
  >({});

  const dtIds = getUniqueDataTypeIds(metricConfigs);
  const dtIdsKey = dtIds.join(',');
  const filterKey = `${filter?.groupId ?? ''}_${filter?.memberId ?? ''}`;

  useEffect(() => {
    if (dtIds.length === 0) return;

    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString();

    const fetchAll = async () => {
      const results: Record<
        string,
        { salesData: SalesPerson[]; recordCount: number }
      > = {};

      await Promise.all(
        dtIds.map(async (dtId) => {
          const params = new URLSearchParams();
          params.set('startDate', startDate);
          params.set('endDate', endDate);
          params.set('dataTypeId', dtId);
          if (filter?.memberId) params.set('memberId', filter.memberId);
          else if (filter?.groupId) params.set('groupId', filter.groupId);

          try {
            const res = await fetch(`/api/sales?${params.toString()}`);
            if (res.ok) {
              const json = await res.json();
              results[dtId] = {
                salesData: json.data,
                recordCount: json.recordCount,
              };
            }
          } catch {
            // ignore
          }
        }),
      );

      setDataMap(results);
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dtIdsKey, filterKey]);

  return dataMap;
}

export default function NumberBoard({
  salesData,
  recordCount,
  metrics,
  metricConfigs,
  darkMode = false,
  unit = DEFAULT_UNIT,
  dataTypes,
  filter,
}: NumberBoardProps) {
  const displayMetrics =
    metrics.length > 0
      ? metrics
      : (['TOTAL_SALES', 'TOTAL_COUNT'] as NumberBoardMetric[]);

  // メトリクスごとに個別dataTypeIdが設定されている場合、そのデータを個別取得
  const perMetricData = usePerMetricData(metricConfigs, filter);

  const metricValues = displayMetrics.map((m) => {
    const metricUnit = resolveMetricUnit(m, metricConfigs, dataTypes, unit);
    const conf = metricConfigs?.find((c) => c.metric === m);

    // 個別dataTypeIdのデータがあればそちらを使う
    if (conf?.dataTypeId && perMetricData[conf.dataTypeId]) {
      const data = perMetricData[conf.dataTypeId];
      return computeMetric(m, data.salesData, data.recordCount, metricUnit);
    }

    // デフォルト: 親から渡されたsalesDataを使う
    return computeMetric(m, salesData, recordCount, metricUnit);
  });

  // Single metric: use maximum size, multiple: scale down
  const isSingle = metricValues.length === 1;

  return (
    <div
      className={`h-full flex flex-col items-center justify-center px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
    >
      <div
        className={`flex flex-col ${isSingle ? 'gap-4' : 'gap-8'} items-center w-full max-w-5xl`}
      >
        {metricValues.map((mv, i) => (
          <div key={displayMetrics[i]} className="text-center w-full">
            {/* Label */}
            <div
              className={`font-semibold tracking-widest uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              style={{
                fontSize: isSingle
                  ? 'clamp(1rem, 3vw, 2rem)'
                  : 'clamp(0.8rem, 2vw, 1.4rem)',
              }}
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
              <div
                className={`mx-auto mt-6 w-24 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
