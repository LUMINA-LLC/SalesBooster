'use client';

import { DisplayViewConfig } from '@/types/display';
import { AggregationUnit } from '@/types/salesView';
import {
  AGGREGATION_UNIT_VIEW_TYPES,
  MIN_GROUPS_FOR_AGGREGATION_UNIT,
} from '@/const/salesView';
import Select from '@/components/common/Select';

interface AggregationUnitSelectorProps {
  view: DisplayViewConfig;
  /** テナントのグループ数（2件以上で表示） */
  groupCount: number;
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

/**
 * ビューごとの集計単位（メンバー / グループ）を設定するセレクタ。
 * ダッシュボードの集計単位トグルと同形式で、グループが2件以上ある場合のみ表示する。
 * null/undefined/"member" = メンバー単位、"group" = グループ単位。
 */
export default function AggregationUnitSelector({
  view,
  groupCount,
  onUpdate,
}: AggregationUnitSelectorProps) {
  if (!AGGREGATION_UNIT_VIEW_TYPES.has(view.viewType)) return null;
  if (groupCount < MIN_GROUPS_FOR_AGGREGATION_UNIT) return null;

  // 保存値は null/undefined/"member" がメンバー単位。
  const current: AggregationUnit =
    view.aggregationUnit === 'group' ? 'group' : 'member';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">集計単位:</span>
      <Select
        value={current}
        onChange={(v) =>
          onUpdate({
            aggregationUnit: v === 'group' ? 'group' : 'member',
          })
        }
        options={[
          { value: 'member', label: 'メンバー' },
          { value: 'group', label: 'グループ' },
        ]}
      />
    </div>
  );
}
