'use client';

import React, { useState, useEffect } from 'react';
import { UNIT_OPTIONS, DEFAULT_UNIT } from '@/constants/units';
import { getUnitLabel } from '@/lib/units';

interface DataTypeInput {
  name: string;
  unit: string;
  saved: boolean;
}

const DEFAULT_SUGGESTIONS = [
  { name: '売上', unit: 'MAN_YEN' as const },
  { name: '粗利', unit: 'MAN_YEN' as const },
  { name: '契約件数', unit: 'KEN' as const },
];

export default function StepDataTypes() {
  const [dataTypes, setDataTypes] = useState<DataTypeInput[]>([{ name: '', unit: DEFAULT_UNIT, saved: false }]);
  const [existingCount, setExistingCount] = useState(0);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/data-types?active=true')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExistingCount(data.length);
          const existing = data.map((dt: { name: string; unit?: string }) => ({
            name: dt.name,
            unit: dt.unit || '',
            saved: true,
          }));
          setDataTypes([...existing, { name: '', unit: DEFAULT_UNIT, saved: false }]);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (index: number, field: 'name' | 'unit', value: string) => {
    setDataTypes((prev) => prev.map((dt, i) => (i === index ? { ...dt, [field]: value } : dt)));
    setError(null);
  };

  const handleSave = async (index: number) => {
    const dt = dataTypes[index];
    if (!dt.name.trim()) {
      setError('データ種類名を入力してください');
      return;
    }

    setSaving(index);
    setError(null);
    try {
      const res = await fetch('/api/data-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: dt.name.trim(), unit: dt.unit || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'データ種類の作成に失敗しました');
      }
      setDataTypes((prev) => {
        const updated = [...prev];
        updated[index] = { ...dt, saved: true };
        if (updated[updated.length - 1].saved) {
          updated.push({ name: '', unit: DEFAULT_UNIT, saved: false });
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(null);
    }
  };

  const handleSuggestion = (suggestion: { name: string; unit: string }) => {
    // 既に同名があるならスキップ
    if (dataTypes.some((dt) => dt.name === suggestion.name)) return;
    setDataTypes((prev) => {
      const lastIndex = prev.length - 1;
      const updated = [...prev];
      if (!updated[lastIndex].saved && !updated[lastIndex].name.trim()) {
        updated[lastIndex] = { ...suggestion, saved: false };
      } else {
        updated.push({ ...suggestion, saved: false });
      }
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setDataTypes((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 || updated[updated.length - 1].saved) {
        updated.push({ name: '', unit: DEFAULT_UNIT, saved: false });
      }
      return updated;
    });
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        グラフに表示するデータの種類を設定します。
        {existingCount > 0 && (
          <span className="text-blue-600 ml-1">（既に{existingCount}件設定済み）</span>
        )}
      </p>

      {/* サジェストボタン */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-gray-500 self-center">クイック追加:</span>
        {DEFAULT_SUGGESTIONS.map((s) => {
          const exists = dataTypes.some((dt) => dt.name === s.name);
          return (
            <button
              key={s.name}
              onClick={() => handleSuggestion(s)}
              disabled={exists}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                exists
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {s.name}（{getUnitLabel(s.unit)}）
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {dataTypes.map((dt, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={dt.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              placeholder="例: 売上"
              disabled={dt.saved}
              className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                dt.saved
                  ? 'bg-gray-50 border-gray-200 text-gray-600'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            <select
              value={dt.unit}
              onChange={(e) => handleChange(index, 'unit', e.target.value)}
              disabled={dt.saved}
              className={`w-24 px-3 py-2 text-sm border rounded-lg transition-colors ${
                dt.saved
                  ? 'bg-gray-50 border-gray-200 text-gray-600'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {dt.saved ? (
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSave(index)}
                disabled={saving === index || !dt.name.trim()}
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
        データ種類は後から設定画面で追加・編集できます。スキップして完了することもできます。
      </p>
    </div>
  );
}
