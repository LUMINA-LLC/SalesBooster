'use client';

import Button from '@/components/common/Button';

export default function GraphIconTabs() {
  return (
    <div className="flex items-center gap-0.5">
      {/* 棒グラフアイコン */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="棒グラフ"
        icon={
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-8h-4v8z" />
          </svg>
        }
      />
      {/* 折れ線グラフアイコン */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="折れ線グラフ"
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"
            />
          </svg>
        }
      />
      {/* テーブルアイコン */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="テーブル"
        icon={
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v18H3V3zm2 2v4h6V5H5zm8 0v4h6V5h-6zM5 11v4h6v-4H5zm8 0v4h6v-4h-6zM5 17v2h6v-2H5zm8 0v2h6v-2h-6z" />
          </svg>
        }
      />
    </div>
  );
}
