'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';
import { getCurrentMonth, type MemberOption } from './utils';

interface AddMembersSectionProps {
  allMembers: MemberOption[];
  /** 既に現在所属中のメンバーID(候補から除外) */
  excludeIds: Set<string>;
  submitting: boolean;
  /** 一括追加実行 (空の終了月は null) */
  onAdd: (params: {
    userIds: string[];
    startMonth: string; // YYYY-MM
    endMonth: string | null; // YYYY-MM or null
  }) => Promise<void>;
  /** 親の groupId が切り替わった時にフォームをリセットするためのキー */
  resetKey: string | number;
}

export default function AddMembersSection({
  allMembers,
  excludeIds,
  submitting,
  onAdd,
  resetKey,
}: AddMembersSectionProps) {
  const [selectedAddIds, setSelectedAddIds] = useState<Set<string>>(new Set());
  const [addStartMonth, setAddStartMonth] = useState(getCurrentMonth());
  const [addEndMonth, setAddEndMonth] = useState<string>('');
  const [addSearch, setAddSearch] = useState('');

  useEffect(() => {
    setSelectedAddIds(new Set());
    setAddStartMonth(getCurrentMonth());
    setAddEndMonth('');
    setAddSearch('');
  }, [resetKey]);

  const availableMembers = useMemo(() => {
    const q = addSearch.toLowerCase();
    return allMembers.filter(
      (m) =>
        !excludeIds.has(m.id) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          (m.department && m.department.toLowerCase().includes(q))),
    );
  }, [allMembers, excludeIds, addSearch]);

  const handleToggleAdd = (id: string) => {
    setSelectedAddIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllAdd = () => {
    setSelectedAddIds(new Set(availableMembers.map((m) => m.id)));
  };

  const handleDeselectAllAdd = () => {
    setSelectedAddIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedAddIds.size === 0 || !addStartMonth) return;
    if (addEndMonth && addEndMonth < addStartMonth) {
      await Dialog.error('終了月は開始月以降を指定してください。');
      return;
    }
    await onAdd({
      userIds: Array.from(selectedAddIds),
      startMonth: addStartMonth,
      endMonth: addEndMonth || null,
    });
    setSelectedAddIds(new Set());
    setAddEndMonth('');
  };

  const allAvailableSelected =
    availableMembers.length > 0 &&
    availableMembers.every((m) => selectedAddIds.has(m.id));

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        メンバーを追加
      </h4>
      <div className="flex items-end flex-wrap gap-2 mb-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">開始月</label>
          <input
            type="month"
            value={addStartMonth}
            onChange={(e) => setAddStartMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            終了月（空欄=現在所属中）
          </label>
          <input
            type="month"
            value={addEndMonth}
            onChange={(e) => setAddEndMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="未設定"
          />
        </div>
        <Button
          label={submitting ? '追加中...' : `${selectedAddIds.size}名を追加`}
          onClick={handleSubmit}
          disabled={submitting || selectedAddIds.size === 0}
        />
      </div>
      <div className="mb-2">
        <input
          type="text"
          value={addSearch}
          onChange={(e) => setAddSearch(e.target.value)}
          placeholder="名前・部署で検索..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {availableMembers.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-4 border border-gray-200 rounded-lg">
          追加可能なメンバーがいません
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              {availableMembers.length}名 表示中 / {selectedAddIds.size}名
              選択中
            </span>
            <div className="space-x-2">
              <button
                onClick={handleSelectAllAdd}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                すべて選択
              </button>
              <button
                onClick={handleDeselectAllAdd}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                すべて解除
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
            <label className="flex items-center px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={allAvailableSelected}
                onChange={
                  allAvailableSelected
                    ? handleDeselectAllAdd
                    : handleSelectAllAdd
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-600">
                全選択
              </span>
            </label>
            {availableMembers.map((m) => (
              <label
                key={m.id}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedAddIds.has(m.id)}
                  onChange={() => handleToggleAdd(m.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-800">{m.name}</span>
                {m.department && (
                  <span className="ml-2 text-xs text-gray-400">
                    {m.department}
                  </span>
                )}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
