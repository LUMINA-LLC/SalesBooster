'use client';

import { ViewType, VIEW_TYPE_LABELS } from '@/types';
import { DisplayViewConfig } from '@/types/display';

interface DisplayMiniHeaderProps {
  visible: boolean;
  displayedView: ViewType;
  currentViewIndex: number;
  enabledViews: DisplayViewConfig[];
  progress: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function DisplayMiniHeader({
  visible,
  displayedView,
  currentViewIndex,
  enabledViews,
  progress,
  onPrev,
  onNext,
  onExit,
}: DisplayMiniHeaderProps) {
  return (
    <div
      className={`absolute top-0 left-0 right-0 z-50 h-10 backdrop-blur flex items-center px-4 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}
      style={{
        backgroundColor: 'var(--display-header-bg)',
        borderBottom: '1px solid var(--display-border)',
      }}
    >
      <span
        className="text-sm font-medium shrink-0"
        style={{ color: 'var(--display-text-secondary)' }}
      >
        {VIEW_TYPE_LABELS[displayedView]} ({currentViewIndex + 1}/
        {enabledViews.length})
      </span>

      <div className="flex items-center mx-4 space-x-2">
        <button onClick={onPrev} className="p-1 hover:bg-gray-100/20 rounded">
          <svg
            className="w-4 h-4"
            style={{ color: 'var(--display-text-secondary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button onClick={onNext} className="p-1 hover:bg-gray-100/20 rounded">
          <svg
            className="w-4 h-4"
            style={{ color: 'var(--display-text-secondary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 mx-2">
        <div
          className="h-1 rounded"
          style={{ backgroundColor: 'var(--display-border)' }}
        >
          <div
            className="h-1 bg-blue-600 rounded transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onClick={onExit}
        className="ml-2 px-3 py-1 text-xs rounded hover:bg-gray-100/20 shrink-0"
        style={{
          color: 'var(--display-text-secondary)',
          border: '1px solid var(--display-border)',
        }}
      >
        終了
      </button>
    </div>
  );
}
