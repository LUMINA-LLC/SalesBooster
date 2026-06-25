'use client';

import { DisplayViewConfig } from '@/types/display';
import { getUnitLabel } from '@/lib/units';
import Select from '@/components/common/Select';

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

/**
 * データ種類セレクタを表示するビュータイプ。
 * REPORT は画面内で全データ種類を表示するため、データ種類の絞り込み設定は持たない。
 */
const DATA_TYPE_VIEW_TYPES: Set<string> = new Set([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">データ種類:</span>
      <Select
        value={view.dataTypeId != null ? String(view.dataTypeId) : ''}
        onChange={(v) => onUpdate({ dataTypeId: v ? Number(v) : null })}
        options={dataTypes.map((dt) => ({
          value: String(dt.id),
          label: `${dt.name}(${getUnitLabel(dt.unit)})`,
        }))}
      />
    </div>
  );
}
