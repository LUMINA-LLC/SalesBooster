'use client';

import { useState } from 'react';
import { ReportPeriodSummary } from '@/types/report';
import DataTypeBlock from './DataTypeBlock';

interface PeriodPanelProps {
  title: string;
  period: ReportPeriodSummary;
  /** タイトル右側に置く要素（平均タブなど） */
  rightSlot?: React.ReactNode;
}

/** 1期間分のパネル（データ種類ごとの指標を縦に並べる） */
export default function PeriodPanel({
  title,
  period,
  rightSlot,
}: PeriodPanelProps) {
  // 展開中のデータ種類ID（初期はすべて折りたたみ）。パネルごとに独立して開閉する。
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  const onToggle = (dataTypeId: number) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(dataTypeId)) next.delete(dataTypeId);
      else next.add(dataTypeId);
      return next;
    });
  };
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <h3 className="text-sm font-bold text-[#2193b0]">{title}</h3>
        {rightSlot}
      </div>
      {/* ヘッダ行 */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-1.5 text-[11px] text-gray-400">
        <span className="w-28 shrink-0" />
        <span className="w-28 shrink-0 text-right">実績</span>
        <span className="w-24 shrink-0 text-right">目標</span>
        <span className="w-14 shrink-0 text-right">達成率</span>
      </div>
      <div className="flex-1 overflow-auto px-4">
        {period.dataTypes.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            データ種類がありません
          </div>
        ) : (
          period.dataTypes.map((dt) => (
            <DataTypeBlock
              key={dt.dataTypeId}
              dt={dt}
              expanded={expandedSet.has(dt.dataTypeId)}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
