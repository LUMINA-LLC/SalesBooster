'use client';

import { useState, useEffect } from 'react';
import { DisplayViewConfig } from '@/types/display';
import { MAIN_AGGREGATE_VALUE } from '@/const/salesView';
import { getUnitLabel } from '@/lib/units';
import Select from '@/components/common/Select';
import type { AggregatableFieldOption } from '@/hooks/useDashboardInit';

interface AggregatableFieldSelectorProps {
  view: DisplayViewConfig;
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

/**
 * 集計値セレクタを表示するビュータイプ。
 * REPORT は全データ種類を表示するため対象外（データ種類設定自体を持たない）。
 */
const AGGREGATABLE_VIEW_TYPES: Set<string> = new Set([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
  'RECORD',
]);

/**
 * ビューごとの集計値（メイン値 / 集計対象カスタムフィールド）を設定するセレクタ。
 * ダッシュボードの集計値プルダウンと同形式（"value" / "cf_<id>"）。
 * 選択中データ種類の集計対象カスタムフィールドが1つ以上ある場合のみ表示する。
 */
export default function AggregatableFieldSelector({
  view,
  onUpdate,
}: AggregatableFieldSelectorProps) {
  const [fields, setFields] = useState<AggregatableFieldOption[]>([]);
  const dataTypeId = view.dataTypeId;

  useEffect(() => {
    if (!AGGREGATABLE_VIEW_TYPES.has(view.viewType) || dataTypeId == null) {
      setFields([]);
      return;
    }
    let active = true;
    fetch(`/api/custom-fields?aggregatable=true&dataTypeId=${dataTypeId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AggregatableFieldOption[]) => {
        if (active) setFields(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setFields([]);
      });
    return () => {
      active = false;
    };
  }, [view.viewType, dataTypeId]);

  if (!AGGREGATABLE_VIEW_TYPES.has(view.viewType) || fields.length === 0) {
    return null;
  }

  // 保存値は ""/"value" がメイン値。プルダウンの value は "value" に正規化。
  const current =
    view.aggregateField && view.aggregateField !== ''
      ? view.aggregateField
      : MAIN_AGGREGATE_VALUE;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">集計値:</span>
      <Select
        value={current}
        onChange={(v) =>
          onUpdate({ aggregateField: v === MAIN_AGGREGATE_VALUE ? '' : v })
        }
        options={[
          { value: MAIN_AGGREGATE_VALUE, label: 'メイン値' },
          ...fields.map((f) => ({
            value: `cf_${f.id}`,
            label: `${f.name}(${getUnitLabel(f.unit)})`,
          })),
        ]}
      />
    </div>
  );
}
