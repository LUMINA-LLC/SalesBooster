'use client';

import { DisplayViewConfig, NumberBoardMetricConfig } from '@/types/display';
import { NumberBoardMetric, NUMBER_BOARD_METRIC_LABELS } from '@/types';
import { getUnitLabel } from '@/lib/units';

const ALL_METRICS: NumberBoardMetric[] = [
  'TOTAL_SALES',
  'TOTAL_COUNT',
  'AVG_ACHIEVEMENT',
  'TEAM_TARGET',
];

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

interface NumberBoardMetricSelectorProps {
  view: DisplayViewConfig;
  dataTypes: DataTypeOption[];
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

export default function NumberBoardMetricSelector({
  view,
  dataTypes,
  onUpdate,
}: NumberBoardMetricSelectorProps) {
  if (view.viewType !== 'NUMBER_BOARD') return null;
  const selected = view.numberBoardMetrics ?? ['TOTAL_SALES', 'TOTAL_COUNT'];
  const metricConfigs = view.numberBoardMetricConfigs ?? [];
  const showDataTypes = dataTypes.length > 1;

  const toggleMetric = (metric: NumberBoardMetric) => {
    const next = selected.includes(metric)
      ? selected.filter((m) => m !== metric)
      : [...selected, metric];
    if (next.length === 0) return;

    const nextConfigs = metricConfigs.filter((c) => next.includes(c.metric));
    for (const m of next) {
      if (!nextConfigs.find((c) => c.metric === m)) {
        nextConfigs.push({ metric: m });
      }
    }

    onUpdate({
      numberBoardMetrics: next,
      numberBoardMetricConfigs: nextConfigs,
    });
  };

  const updateMetricDataType = (
    metric: NumberBoardMetric,
    dataTypeId: string,
  ) => {
    const currentConfigs =
      metricConfigs.length > 0
        ? metricConfigs
        : selected.map((m) => ({ metric: m }));
    const nextConfigs: NumberBoardMetricConfig[] = currentConfigs.map((c) =>
      c.metric === metric ? { ...c, dataTypeId: dataTypeId || undefined } : c,
    );
    if (!nextConfigs.find((c) => c.metric === metric)) {
      nextConfigs.push({ metric, dataTypeId: dataTypeId || undefined });
    }
    onUpdate({ numberBoardMetricConfigs: nextConfigs });
  };

  return (
    <div className="mt-1 space-y-1">
      {ALL_METRICS.map((metric) => {
        const isSelected = selected.includes(metric);
        const conf = metricConfigs.find((c) => c.metric === metric);
        return (
          <div key={metric} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer min-w-[120px]">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleMetric(metric)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span className="text-xs text-gray-600">
                {NUMBER_BOARD_METRIC_LABELS[metric]}
              </span>
            </label>
            {showDataTypes && isSelected && (
              <select
                value={conf?.dataTypeId ?? ''}
                onChange={(e) => updateMetricDataType(metric, e.target.value)}
                className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
              >
                <option value="">デフォルト</option>
                {dataTypes.map((dt) => (
                  <option key={dt.id} value={String(dt.id)}>
                    {dt.name}({getUnitLabel(dt.unit)})
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
