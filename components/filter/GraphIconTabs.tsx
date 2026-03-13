'use client';

import React from 'react';

export default function GraphIconTabs() {
  return (
    <div className="flex items-center space-x-1">
      {/* 棒グラフアイコン */}
      <button className="p-2 hover:bg-gray-200 rounded border border-gray-300 bg-white">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-8h-4v8z" />
        </svg>
      </button>
      {/* 折れ線グラフアイコン */}
      <button className="p-2 hover:bg-gray-200 rounded border border-gray-300 bg-white">
        <svg
          className="w-5 h-5 text-blue-600"
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
      </button>
      {/* テーブルアイコン */}
      <button className="p-2 hover:bg-gray-200 rounded border border-gray-300 bg-white">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 3h18v18H3V3zm2 2v4h6V5H5zm8 0v4h6V5h-6zM5 11v4h6v-4H5zm8 0v4h6v-4h-6zM5 17v2h6v-2H5zm8 0v2h6v-2h-6z" />
        </svg>
      </button>
    </div>
  );
}
