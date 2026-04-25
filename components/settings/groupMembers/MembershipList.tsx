'use client';

import { useState } from 'react';
import { Dialog } from '@/components/common/Dialog';
import { formatMonth, getCurrentMonth, type MembershipRecord } from './utils';

interface MembershipListProps {
  title: string;
  members: MembershipRecord[];
  /** 'current'=現在所属(異動ボタンあり) / 'past'=過去履歴 */
  variant: 'current' | 'past';
  submitting: boolean;
  emptyText?: string;
  onUpdatePeriod: (
    membershipId: number,
    startMonth: string, // YYYY-MM
    endMonth: string | null, // YYYY-MM or null
  ) => Promise<void>;
  /** variant='current' でのみ呼ばれる */
  onEndMembership?: (membershipId: number, endMonth: string) => Promise<void>;
  onRemove: (membershipId: number) => Promise<void>;
}

export default function MembershipList({
  title,
  members,
  variant,
  submitting,
  emptyText,
  onUpdatePeriod,
  onEndMembership,
  onRemove,
}: MembershipListProps) {
  const isCurrent = variant === 'current';

  // 期間編集
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editStartMonth, setEditStartMonth] = useState('');
  const [editEndMonth, setEditEndMonth] = useState('');

  // 異動 (current のみ)
  const [endingId, setEndingId] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState(getCurrentMonth());

  const startEditPeriod = (m: MembershipRecord) => {
    setEditingPeriodId(m.id);
    setEditStartMonth(m.startMonth.slice(0, 7));
    setEditEndMonth(m.endMonth ? m.endMonth.slice(0, 7) : '');
  };

  const handleConfirmPeriod = async (membershipId: number) => {
    if (!editStartMonth) return;
    if (editEndMonth && editEndMonth < editStartMonth) {
      await Dialog.error('終了月は開始月以降を指定してください。');
      return;
    }
    await onUpdatePeriod(membershipId, editStartMonth, editEndMonth || null);
    setEditingPeriodId(null);
  };

  const startEnding = (membershipId: number) => {
    setEndingId(membershipId);
    setEndMonth(getCurrentMonth());
  };

  const handleConfirmEnd = async (membershipId: number) => {
    if (!endMonth || !onEndMembership) return;
    await onEndMembership(membershipId, endMonth);
    setEndingId(null);
  };

  const titleSuffix = isCurrent ? ` (${members.length}名)` : '';

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {title}
        {titleSuffix}
      </h4>
      {members.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-4 border border-gray-200 rounded-lg">
          {emptyText ?? 'メンバーがいません'}
        </div>
      ) : (
        <div
          className={`border border-gray-200 rounded-lg ${
            isCurrent ? 'max-h-64' : 'max-h-48'
          } overflow-y-auto divide-y divide-gray-100`}
        >
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-4 py-2.5 ${
                isCurrent ? '' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-gray-800' : 'text-gray-600'
                  }`}
                >
                  {m.user.name}
                </span>
                {editingPeriodId === m.id ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <input
                      type="month"
                      value={editStartMonth}
                      onChange={(e) => setEditStartMonth(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">〜</span>
                    <input
                      type="month"
                      value={editEndMonth}
                      onChange={(e) => setEditEndMonth(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="空欄=現在所属"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-xs text-gray-400">
                    {formatMonth(m.startMonth)} 〜
                    {!isCurrent && m.endMonth
                      ? ` ${formatMonth(m.endMonth)}`
                      : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editingPeriodId === m.id ? (
                  <>
                    <button
                      onClick={() => handleConfirmPeriod(m.id)}
                      disabled={submitting}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      確定
                    </button>
                    <button
                      onClick={() => setEditingPeriodId(null)}
                      className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                    >
                      取消
                    </button>
                  </>
                ) : isCurrent && endingId === m.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="month"
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleConfirmEnd(m.id)}
                      disabled={submitting}
                      className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
                    >
                      確定
                    </button>
                    <button
                      onClick={() => setEndingId(null)}
                      className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => startEditPeriod(m)}
                      className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      期間編集
                    </button>
                    {isCurrent && (
                      <button
                        onClick={() => startEnding(m.id)}
                        className="text-xs px-2 py-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                      >
                        異動
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(m.id)}
                      className={`text-xs px-2 py-1 rounded hover:bg-red-50 ${
                        isCurrent
                          ? 'text-red-500 hover:text-red-700'
                          : 'text-red-400 hover:text-red-600'
                      }`}
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
