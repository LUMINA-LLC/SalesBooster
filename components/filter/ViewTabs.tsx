'use client';

import Button from '@/components/common/Button';
import { ViewType, VALID_VIEW_TYPES, VIEW_TYPE_LABELS } from '@/types';

/** ディスプレイモード専用のビュー（トップ画面では非表示） */
const DISPLAY_ONLY_VIEWS: ReadonlySet<ViewType> = new Set([
  'CUSTOM_SLIDE',
  'NUMBER_BOARD',
]);

const TOP_VIEW_TYPES = VALID_VIEW_TYPES.filter(
  (v) => !DISPLAY_ONLY_VIEWS.has(v),
);

interface ViewTabsProps {
  selectedView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ViewTabs({
  selectedView,
  onViewChange,
}: ViewTabsProps) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
      {TOP_VIEW_TYPES.map((view) => (
        <Button
          key={view}
          label={VIEW_TYPE_LABELS[view]}
          variant="ghost"
          color="indigo"
          size="sm"
          isActive={selectedView === view}
          onClick={() => onViewChange(view)}
        />
      ))}
    </div>
  );
}
