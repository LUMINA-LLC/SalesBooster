'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Select from '@/components/common/Select';
import AddCustomFieldModal from './AddCustomFieldModal';
import EditCustomFieldModal from './EditCustomFieldModal';
import type { CustomFieldDefinition } from '@/types/customField';
import { getUnitLabel } from '@/lib/units';

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'テキスト',
  NUMBER: '数値',
  DATE: '日付',
  SELECT: 'プルダウン',
};

interface DataType {
  id: number;
  name: string;
}

export default function RecordSettings() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [selectedDataTypeId, setSelectedDataTypeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingField, setEditingField] =
    useState<CustomFieldDefinition | null>(null);

  useEffect(() => {
    fetch('/api/data-types')
      .then((res) => res.json())
      .then((data: DataType[]) => {
        setDataTypes(data);
        const defaultType = data.find(
          (d) =>
            'isDefault' in d &&
            (d as DataType & { isDefault: boolean }).isDefault,
        );
        if (defaultType) setSelectedDataTypeId(String(defaultType.id));
        else if (data.length > 0) setSelectedDataTypeId(String(data[0].id));
      })
      .catch(console.error);
  }, []);

  const fetchFields = useCallback(async () => {
    if (!selectedDataTypeId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/custom-fields?dataTypeId=${selectedDataTypeId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (err) {
      console.error('Failed to fetch custom fields:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDataTypeId]);

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
      <h2 className="text-xl font-bold text-gray-800 mb-6">データ入力設定</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            カスタム入力フィールド
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            データ種別ごとに、売上入力時に追加で記録するフィールドを設定します。
          </p>

          {dataTypes.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                データ種別
              </label>
              <Select
                value={selectedDataTypeId}
                onChange={(value) => setSelectedDataTypeId(value)}
                options={dataTypes.map((d) => ({
                  value: String(d.id),
                  label: d.name,
                }))}
              />
            </div>
          )}

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
                        {field.fieldType === 'NUMBER' &&
                          field.aggregatable && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                              集計対象 ({getUnitLabel(field.unit)})
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
            disabled={!selectedDataTypeId}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            + フィールドを追加
          </button>
        </div>
      </div>

      <AddCustomFieldModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={fetchFields}
        dataTypeId={Number(selectedDataTypeId)}
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
