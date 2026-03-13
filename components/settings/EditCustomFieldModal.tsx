'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';
import type {
  CustomFieldType,
  CustomFieldDefinition,
} from '@/types/customField';

interface EditCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  field: CustomFieldDefinition | null;
}

const FIELD_TYPE_OPTIONS = [
  { value: 'TEXT', label: 'テキスト' },
  { value: 'DATE', label: '日付' },
  { value: 'SELECT', label: 'プルダウン' },
];

export default function EditCustomFieldModal({
  isOpen,
  onClose,
  onUpdated,
  field,
}: EditCustomFieldModalProps) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('TEXT');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (field) {
      setName(field.name);
      setFieldType(field.fieldType);
      setIsRequired(field.isRequired);
      setOptions(
        field.options && field.options.length > 0 ? field.options : [''],
      );
    }
  }, [field]);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async () => {
    if (!field || !name.trim()) return;

    const validOptions =
      fieldType === 'SELECT' ? options.filter((o) => o.trim()) : undefined;
    if (
      fieldType === 'SELECT' &&
      (!validOptions || validOptions.length === 0)
    ) {
      await Dialog.error('プルダウン型には少なくとも1つの選択肢が必要です。');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/custom-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          fieldType,
          isRequired,
          ...(fieldType === 'SELECT' ? { options: validOptions } : {}),
        }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || 'フィールドの更新に失敗しました。');
      }
    } catch {
      await Dialog.error('フィールドの更新に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button
        label="キャンセル"
        variant="outline"
        color="gray"
        onClick={onClose}
      />
      <Button
        label={submitting ? '更新中...' : '更　新'}
        onClick={handleSubmit}
        disabled={submitting || !name.trim()}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="カスタムフィールド編集"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex items-center">
          <label className="w-28 text-sm text-gray-700 text-right pr-4">
            フィールド名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="例: 顧客名"
          />
        </div>

        <div className="flex items-center">
          <label className="w-28 text-sm text-gray-700 text-right pr-4">
            タイプ
          </label>
          <div className="flex-1">
            <Select
              value={fieldType}
              onChange={(v) => setFieldType(v as CustomFieldType)}
              options={FIELD_TYPE_OPTIONS}
            />
          </div>
        </div>

        <div className="flex items-center">
          <label className="w-28 text-sm text-gray-700 text-right pr-4">
            必須
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">入力必須にする</span>
          </label>
        </div>

        {fieldType === 'SELECT' && (
          <div className="flex items-start">
            <label className="w-28 text-sm text-gray-700 text-right pr-4 pt-2">
              選択肢
            </label>
            <div className="flex-1 space-y-2">
              {options.map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder={`選択肢 ${i + 1}`}
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 選択肢を追加
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
