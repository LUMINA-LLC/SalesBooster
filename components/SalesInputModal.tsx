'use client';

import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Select from './common/Select';
import { Dialog } from './common/Dialog';
import CustomFieldsRenderer from './sales/CustomFieldsRenderer';
import type {
  CustomFieldDefinition,
  CustomFieldValues,
} from '@/types/customField';
import type { DataTypeInfo } from '@/types';
import { getValuePresets } from '@/lib/presets';
import { getUnitLabel } from '@/lib/units';
import { UNIT_MULTIPLIERS } from '@/types/units';
import type { UnitValue } from '@/types/units';
import { toLocalDateTime } from '@/lib/dateLocal';

interface SalesInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalesInputData) => void;
}

interface SalesInputData {
  member: string;
  value: number;
  orderDate: string;
  memo: string;
}

interface MemberOption {
  id: string;
  name: string;
  department: string | null;
}

export default function SalesInputModal({
  isOpen,
  onClose,
  onSubmit,
}: SalesInputModalProps) {
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [selectedDataTypeId, setSelectedDataTypeId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [value, setValue] = useState('');
  const [orderDate, setOrderDate] = useState(() => toLocalDateTime(new Date()));
  const [memo, setMemo] = useState('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<
    CustomFieldDefinition[]
  >([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(
    {},
  );

  const selectedDataType = dataTypes.find(
    (dt) => String(dt.id) === selectedDataTypeId,
  );

  useEffect(() => {
    if (isOpen) {
      fetch('/api/members?type=sales')
        .then((res) => res.json())
        .then((data) => setMembers(data))
        .catch(console.error);
      fetch('/api/data-types?active=true')
        .then((res) => res.json())
        .then((data: DataTypeInfo[]) => {
          setDataTypes(data);
          const defaultType = data.find((dt) => dt.isDefault);
          if (defaultType) {
            setSelectedDataTypeId(String(defaultType.id));
          } else if (data.length > 0) {
            setSelectedDataTypeId(String(data[0].id));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // DataType 変更時にカスタムフィールドを再取得
  useEffect(() => {
    if (isOpen && selectedDataTypeId) {
      fetch(`/api/custom-fields?active=true&dataTypeId=${selectedDataTypeId}`)
        .then((res) => res.json())
        .then((data) => {
          setCustomFieldDefs(data);
          setCustomFieldValues({});
        })
        .catch(console.error);
    }
  }, [isOpen, selectedDataTypeId]);

  const getSubmitValue = (): number => {
    const raw = parseInt(value) || 0;
    const unit = selectedDataType?.unit as UnitValue | undefined;
    const multiplier = unit ? (UNIT_MULTIPLIERS[unit] ?? 1) : 1;
    return raw * multiplier;
  };

  const handleSubmit = async () => {
    if (!memberId || !selectedDataTypeId) return;

    // 必須カスタムフィールドのバリデーション
    for (const field of customFieldDefs) {
      const v = customFieldValues[String(field.id)];
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === 'string' ? v.trim() === '' : false);
      if (field.isRequired && isEmpty) {
        await Dialog.error(`「${field.name}」は必須項目です。`);
        return;
      }
    }

    // メイン値0 かつ カスタムフィールドも全て空 の場合はブロック（無意味なレコード）
    const mainValueIsZero = !value || parseInt(value) === 0;
    if (mainValueIsZero) {
      const hasAnyCustomFieldValue = Object.values(customFieldValues).some(
        (v) =>
          (typeof v === 'number' && Number.isFinite(v)) ||
          (typeof v === 'string' && v.trim() !== ''),
      );
      if (!hasAnyCustomFieldValue) {
        await Dialog.error(
          'メイン値またはサブデータのいずれかを入力してください。',
        );
        return;
      }
    }

    // 空でない値のみ送信
    const filteredCustomFields: Record<string, string | number> = {};
    for (const [key, val] of Object.entries(customFieldValues)) {
      if (typeof val === 'number') {
        if (Number.isFinite(val)) filteredCustomFields[key] = val;
      } else if (typeof val === 'string' && val.trim()) {
        filteredCustomFields[key] = val;
      }
    }

    const submitValue = getSubmitValue();

    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          value: submitValue,
          dataTypeId: Number(selectedDataTypeId),
          description: memo || undefined,
          recordDate: new Date(orderDate).toISOString(),
          ...(Object.keys(filteredCustomFields).length > 0
            ? { customFields: filteredCustomFields }
            : {}),
        }),
      });

      if (res.ok) {
        const selectedMember = members.find((m) => m.id === memberId);
        onSubmit({
          member: selectedMember?.name || '',
          value: submitValue,
          orderDate,
          memo,
        });
        setMemberId('');
        setValue('');
        setMemo('');
        setCustomFieldValues({});
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || 'データの登録に失敗しました。');
      }
    } catch {
      await Dialog.error(
        'データの登録に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const footer = (
    <>
      <Button
        label="キャンセル"
        variant="outline"
        color="gray"
        onClick={handleCancel}
      />
      <Button
        label={submitting ? '送信中...' : '追　加'}
        onClick={handleSubmit}
        disabled={submitting || !memberId || !selectedDataTypeId}
      />
    </>
  );

  const handlePresetClick = (presetValue: number) => {
    const current = parseInt(value) || 0;
    setValue(String(current + presetValue));
  };

  const renderValueInput = () => {
    if (!selectedDataType) return null;

    const presets = getValuePresets(selectedDataType.unit || '');

    return (
      <div className="flex items-start">
        <label className="w-24 text-sm text-gray-700 text-right pr-4 pt-2">
          {selectedDataType.name}
        </label>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder=""
            />
            {selectedDataType.unit && (
              <span className="text-sm text-blue-600">
                {getUnitLabel(selectedDataType.unit)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetClick(p)}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
              >
                +{p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setValue('')}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              C
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="データ入力" footer={footer}>
      <div className="space-y-4">
        {/* データ種類 */}
        <div className="flex items-center">
          <label className="w-24 text-sm text-gray-700 text-right pr-4">
            データ種類
          </label>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {dataTypes.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => {
                    setSelectedDataTypeId(String(dt.id));
                    setValue('');
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedDataTypeId === String(dt.id)
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                  style={
                    selectedDataTypeId === String(dt.id)
                      ? { backgroundColor: dt.color || '#3B82F6' }
                      : undefined
                  }
                >
                  {dt.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* メンバー */}
        <div className="flex items-center">
          <label className="w-24 text-sm text-gray-700 text-right pr-4">
            メンバー
          </label>
          <div className="flex-1">
            <Select
              value={memberId}
              onChange={setMemberId}
              options={[
                { value: '', label: '選択してください...' },
                ...members.map((m) => ({ value: String(m.id), label: m.name })),
              ]}
              placeholder="選択してください..."
            />
          </div>
        </div>

        {/* 値の入力（データ種類に応じて動的） */}
        {renderValueInput()}

        {/* 日時 */}
        <div className="flex items-center">
          <label className="w-24 text-sm text-gray-700 text-right pr-4">
            日時
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="datetime-local"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* 備考 */}
        <div className="flex items-start">
          <label className="w-24 text-sm text-gray-700 text-right pr-4 pt-2">
            備考
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm h-20 resize-none"
          />
        </div>

        {/* カスタムフィールド */}
        <CustomFieldsRenderer
          fields={customFieldDefs}
          values={customFieldValues}
          onChange={(id, val) =>
            setCustomFieldValues((prev) => ({ ...prev, [id]: val }))
          }
        />
      </div>
    </Modal>
  );
}
