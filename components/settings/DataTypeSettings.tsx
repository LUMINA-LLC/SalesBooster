'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@/components/common/Dialog';
import DataTypeDetail from './dataType/DataTypeDetail';
import DataTypeFormModal from './dataType/DataTypeFormModal';
import type { DataTypeInfo } from '@/types';

export default function DataTypeSettings() {
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DataTypeInfo | null>(null);

  const fetchDataTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/data-types');
      if (res.ok) {
        const data: DataTypeInfo[] = await res.json();
        setDataTypes(data);
        // 選択中のタブを維持しつつ、なければデフォルト/先頭を選択
        setSelectedId((prev) => {
          if (prev != null && data.some((d) => d.id === prev)) return prev;
          const def = data.find((d) => d.isDefault);
          return def?.id ?? data[0]?.id ?? null;
        });
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
        // 削除したタブが選択中なら別タブへ
        setSelectedId((prev) => (prev === dt.id ? null : prev));
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

  const selectedType = dataTypes.find((d) => d.id === selectedId) ?? null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">データ種類管理</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-2">入力データの種類</h3>
          <p className="text-sm text-gray-500 mb-4">
            ダッシュボードに表示するデータの種類を管理します。タブで種類を選び、基本設定と入力フィールドを編集できます。
          </p>

          {loading ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              読み込み中...
            </div>
          ) : dataTypes.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">
              データ種類がまだ登録されていません。
              <div className="mt-3">
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + データ種類を追加
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* データ種類タブ */}
              <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 mb-6">
                {dataTypes.map((dt) => {
                  const isActive = selectedId === dt.id;
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setSelectedId(dt.id)}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      } ${dt.isActive ? '' : 'opacity-60'}`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dt.color || '#3B82F6' }}
                      />
                      <span>{dt.name}</span>
                      {!dt.isActive && (
                        <span className="text-[10px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded">
                          無効
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 -mb-px"
                  title="データ種類を追加"
                >
                  + 追加
                </button>
              </div>

              {/* 選択中データ種類の詳細 */}
              {selectedType && (
                <DataTypeDetail
                  dataType={selectedType}
                  onEdit={() => handleEdit(selectedType)}
                  onToggleActive={() => handleToggleActive(selectedType)}
                  onDelete={() => handleDelete(selectedType)}
                />
              )}
            </>
          )}
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
