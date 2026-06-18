'use client';

import { DisplayViewConfig } from '@/types/display';

interface MembersPerPageInputProps {
  view: DisplayViewConfig;
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

/** 表示人数設定を出すビュータイプ（メンバーを横に並べるグラフ系） */
const PAGEABLE_VIEW_TYPES: Set<string> = new Set([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
]);

/**
 * 1ページの表示人数を設定する入力。
 * 空欄 = 全員表示（ページングなし）、数値 = その人数ずつ自動ページ送り。
 */
export default function MembersPerPageInput({
  view,
  onUpdate,
}: MembersPerPageInputProps) {
  if (!PAGEABLE_VIEW_TYPES.has(view.viewType)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">1ページの表示人数:</span>
      <input
        type="number"
        min={1}
        value={view.membersPerPage ?? ''}
        onChange={(e) => {
          const n = Number(e.target.value);
          onUpdate({
            membersPerPage:
              e.target.value === '' || !Number.isFinite(n) || n <= 0 ? null : n,
          });
        }}
        placeholder="全員"
        className="w-20 rounded border border-gray-300 px-3 py-1.5 text-sm"
      />
    </div>
  );
}
