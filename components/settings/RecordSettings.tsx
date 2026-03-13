'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@/components/common/Dialog';
import AddCustomFieldModal from './AddCustomFieldModal';
import EditCustomFieldModal from './EditCustomFieldModal';
import type { CustomFieldDefinition } from '@/types/customField';

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'テキスト',
  DATE: '日付',
  SELECT: 'プルダウン',
};

export default function RecordSettings() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingField, setEditingField] =
    useState<CustomFieldDefinition | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const res = await fetch('/api/custom-fields');
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (err) {
      console.error('Failed to fetch custom fields:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleDelete = async (field: CustomFieldDefinition) => {
    const confirmed = await Dialog.confirm(
      `カスタムフィールド「${field.name}」を削除しますか？\n既存の売上データに入力された値は保持されます。`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/custom-fields/${field.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchFields();
      } else {
        await Dialog.error('削除に失敗しました。');
      }
    } catch {
      await Dialog.error('削除に失敗しました。');
    }
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setEditModalOpen(true);
  };

  const activeFields = fields.filter((f) => f.isActive);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">レコード設定</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            カスタム入力フィールド
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            売上入力時に追加で記録するフィールドを設定します。
          </p>

          {loading ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              読み込み中...
            </div>
          ) : activeFields.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              カスタムフィールドはまだ登録されていません。
            </div>
          ) : (
            <div className="space-y-2">
              {activeFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {field.name}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {FIELD_TYPE_LABELS[field.fieldType] ||
                            field.fieldType}
                        </span>
                        {field.isRequired && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            必須
                          </span>
                        )}
                        {field.fieldType === 'SELECT' && field.options && (
                          <span className="text-xs text-gray-400">
                            ({(field.options as string[]).length}項目)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(field)}
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
                    <button
                      onClick={() => handleDelete(field)}
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
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setAddModalOpen(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + フィールドを追加
          </button>
        </div>
      </div>

      <AddCustomFieldModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={fetchFields}
      />

      <EditCustomFieldModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingField(null);
        }}
        onUpdated={fetchFields}
        field={editingField}
      />
    </div>
  );
}
