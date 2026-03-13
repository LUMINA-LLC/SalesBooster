'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@/components/common/Dialog';
import { UNIT_OPTIONS, DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel } from '@/lib/units';
import type { UnitValue } from '@/types/units';
import type { DataTypeInfo } from '@/types';

const DEFAULT_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#6366F1',
  '#14B8A6',
];

export default function DataTypeSettings() {
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DataTypeInfo | null>(null);

  const fetchDataTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/data-types');
      if (res.ok) {
        setDataTypes(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch data types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataTypes();
  }, [fetchDataTypes]);

  const handleDelete = async (dt: DataTypeInfo) => {
    if (dt.isDefault) {
      await Dialog.error('デフォルトのデータ種類は削除できません。');
      return;
    }
    const confirmed = await Dialog.confirm(
      `データ種類「${dt.name}」を削除しますか？\nこの種類に紐づくデータは残りますが、種類の紐づけが解除されます。`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/data-types/${dt.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDataTypes();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '削除に失敗しました。');
      }
    } catch {
      await Dialog.error('削除に失敗しました。');
    }
  };

  const handleToggleActive = async (dt: DataTypeInfo) => {
    try {
      const res = await fetch(`/api/data-types/${dt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !dt.isActive }),
      });
      if (res.ok) {
        fetchDataTypes();
      }
    } catch {
      await Dialog.error('更新に失敗しました。');
    }
  };

  const handleEdit = (dt: DataTypeInfo) => {
    setEditingType(dt);
    setEditModalOpen(true);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">データ種類管理</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-2">入力データの種類</h3>
          <p className="text-sm text-gray-500 mb-4">
            ダッシュボードに表示するデータの種類を管理します。入力時にユーザーがどの種類のデータを入力するか選択します。
          </p>

          {loading ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              読み込み中...
            </div>
          ) : dataTypes.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              データ種類がまだ登録されていません。
            </div>
          ) : (
            <div className="space-y-2">
              {dataTypes.map((dt) => (
                <div
                  key={dt.id}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg ${dt.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dt.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-800">
                          {dt.name}
                        </span>
                        {dt.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                            デフォルト
                          </span>
                        )}
                        {!dt.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                            無効
                          </span>
                        )}
                      </div>
                      {dt.unit && (
                        <div className="mt-0.5">
                          <span className="text-xs text-gray-400">
                            単位: {getUnitLabel(dt.unit)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(dt)}
                      className={`p-1.5 transition-colors ${dt.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-green-500'}`}
                      title={dt.isActive ? '無効にする' : '有効にする'}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {dt.isActive ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(dt)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="編集"
                    >
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {!dt.isDefault && (
                      <button
                        onClick={() => handleDelete(dt)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="削除"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setAddModalOpen(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + データ種類を追加
          </button>
        </div>
      </div>

      {/* 追加モーダル */}
      <DataTypeFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={fetchDataTypes}
      />

      {/* 編集モーダル */}
      <DataTypeFormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingType(null);
        }}
        onSaved={fetchDataTypes}
        dataType={editingType}
      />
    </div>
  );
}

// ─── 追加/編集モーダル ───

interface DataTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  dataType?: DataTypeInfo | null;
}

function DataTypeFormModal({
  isOpen,
  onClose,
  onSaved,
  dataType,
}: DataTypeFormModalProps) {
  const isEdit = !!dataType;
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (dataType) {
        setName(dataType.name);
        setUnit(dataType.unit);
        setColor(dataType.color || DEFAULT_COLORS[0]);
      } else {
        setName('');
        setUnit(DEFAULT_UNIT);
        setColor(
          DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        );
      }
    }
  }, [isOpen, dataType]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      await Dialog.error('名前を入力してください。');
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/data-types/${dataType!.id}`
        : '/api/data-types';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), unit, color }),
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '保存に失敗しました。');
      }
    } catch {
      await Dialog.error('保存に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isEdit ? 'データ種類を編集' : 'データ種類を追加'}
        </h3>

        <div className="space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="例: 売上、契約数、面談数"
            />
          </div>

          {/* 単位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              単位
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitValue)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              グラフの色
            </label>
            <div className="flex items-center space-x-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-gray-800 scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '保存中...' : isEdit ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
