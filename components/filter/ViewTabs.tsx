'use client';

import React from 'react';
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
    <div className="flex items-center border border-gray-300 rounded bg-white">
      {TOP_VIEW_TYPES.map((view, index) => (
        <button
          key={view}
          className={`px-4 py-1 text-sm ${index > 0 ? 'border-l border-gray-300' : ''} ${
            selectedView === view
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onViewChange(view)}
        >
          {VIEW_TYPE_LABELS[view]}
        </button>
      ))}
    </div>
  );
}
