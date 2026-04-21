'use client';

import { DisplayViewConfig } from '@/types/display';
import { getUnitLabel } from '@/lib/units';

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

interface DataTypeSelectorProps {
  view: DisplayViewConfig;
  dataTypes: DataTypeOption[];
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

/** データ種類セレクタを表示するビュータイプ */
const DATA_TYPE_VIEW_TYPES: Set<string> = new Set([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
  'REPORT',
  'RECORD',
]);

export default function DataTypeSelector({
  view,
  dataTypes,
  onUpdate,
}: DataTypeSelectorProps) {
  if (!DATA_TYPE_VIEW_TYPES.has(view.viewType)) return null;
  if (dataTypes.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <span className="text-xs text-gray-500">データ種類:</span>
      <select
        value={view.dataTypeId ?? ''}
        onChange={(e) => onUpdate({ dataTypeId: e.target.value })}
        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
      >
        {dataTypes.length === 0 && <option value="">デフォルト</option>}
        {dataTypes.map((dt) => (
          <option key={dt.id} value={String(dt.id)}>
            {dt.name}({getUnitLabel(dt.unit)})
          </option>
        ))}
      </select>
    </div>
  );
}
