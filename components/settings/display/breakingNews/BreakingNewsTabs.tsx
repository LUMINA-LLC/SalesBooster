'use client';

import type { BreakingNewsConfig } from '@/types/display';
import { DEFAULT_TAB_ID, type DataTypeOption } from './types';

interface BreakingNewsTabsProps {
  dataTypes: DataTypeOption[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  findPerConfig: (dataTypeId: number) => BreakingNewsConfig | undefined;
  /** データ種別が複数ある時はデフォルトタブを隠す */
  hideDefaultTab: boolean;
}

export default function BreakingNewsTabs({
  dataTypes,
  activeTab,
  onTabChange,
  findPerConfig,
  hideDefaultTab,
}: BreakingNewsTabsProps) {
  const isDefaultTab = activeTab === DEFAULT_TAB_ID;

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
      {!hideDefaultTab && (
        <button
          type="button"
          onClick={() => onTabChange(DEFAULT_TAB_ID)}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            isDefaultTab
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          デフォルト
        </button>
      )}
      {dataTypes.map((dt) => {
        const pc = findPerConfig(dt.id);
        const isActive = activeTab === String(dt.id);
        const isOverridden =
          pc &&
          (pc.enabled === false || pc.message !== null || pc.videoId !== null);
        return (
          <button
            key={dt.id}
            type="button"
            onClick={() => onTabChange(String(dt.id))}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {dt.name}
            {pc && pc.enabled === false && (
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                無効
              </span>
            )}
            {isOverridden && pc?.enabled !== false && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
