'use client';

import React, { useState, useEffect } from 'react';

interface GroupItem {
  id?: number;
  name: string;
  saved: boolean;
}

export default function StepGroups() {
  const [groups, setGroups] = useState<GroupItem[]>([{ name: '', saved: false }]);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 既存グループを読み込み
  useEffect(() => {
    fetch('/api/groups')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const existing = data.map((g: { id: number; name: string }) => ({
            id: g.id,
            name: g.name,
            saved: true,
          }));
          setGroups([...existing, { name: '', saved: false }]);
        }
      })
      .catch(() => {});
  }, []);

  const handleNameChange = (index: number, value: string) => {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, name: value } : g)));
    setError(null);
  };

  const handleSave = async (index: number) => {
    const group = groups[index];
    if (!group.name.trim()) {
      setError('グループ名を入力してください');
      return;
    }

    setSaving(index);
    setError(null);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: group.name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'グループの作成に失敗しました');
      }
      const created = await res.json();
      setGroups((prev) => {
        const updated = [...prev];
        updated[index] = { id: created.id ?? created.data?.id, name: group.name.trim(), saved: true };
        // 最後の行が保存済みなら新しい空行を追加
        if (updated[updated.length - 1].saved) {
          updated.push({ name: '', saved: false });
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveRow = (index: number) => {
    setGroups((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 || updated[updated.length - 1].saved) {
        updated.push({ name: '', saved: false });
      }
      return updated;
    });
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        営業チームのグループを作成します。後から追加・変更も可能です。
      </p>

      <div className="space-y-3">
        {groups.map((group, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={group.name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              placeholder="例: 東京営業部"
              disabled={group.saved}
              className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                group.saved
                  ? 'bg-gray-50 border-gray-200 text-gray-600'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !group.saved) handleSave(index);
              }}
            />
            {group.saved ? (
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSave(index)}
                disabled={saving === index || !group.name.trim()}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {saving === index ? '保存中...' : '追加'}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-4 text-xs text-gray-400">
        グループは後から設定画面で追加・編集できます。スキップして次へ進むこともできます。
      </p>
    </div>
  );
}
