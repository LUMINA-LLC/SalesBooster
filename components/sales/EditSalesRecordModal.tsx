'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';
import CustomFieldsRenderer from './CustomFieldsRenderer';
import type {
  CustomFieldDefinition,
  CustomFieldValues,
} from '@/types/customField';

interface SalesRecord {
  id: number;
  userId: string;
  memberName: string;
  value: number;
  dataTypeId: number | null;
  dataType: { id: number; name: string; unit: string } | null;
  description: string | null;
  customFields: Record<string, string | number> | null;
  recordDate: string;
}

interface MemberOption {
  id: string;
  name: string;
  department: string | null;
}

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

interface EditSalesRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  record: SalesRecord | null;
}

export default function EditSalesRecordModal({
  isOpen,
  onClose,
  onUpdated,
  record,
}: EditSalesRecordModalProps) {
  const [memberId, setMemberId] = useState('');
  const [editValue, setEditValue] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [memo, setMemo] = useState('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dataTypeId, setDataTypeId] = useState('');
  const [dataTypes, setDataTypes] = useState<DataTypeOption[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<
    CustomFieldDefinition[]
  >([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(
    {},
  );

  useEffect(() => {
    if (isOpen) {
      fetch('/api/members?type=sales')
        .then((res) => res.json())
        .then((data) => setMembers(data))
        .catch(console.error);
      fetch('/api/data-types')
        .then((res) => res.json())
        .then((data) =>
          setDataTypes(Array.isArray(data) ? data : (data?.data ?? [])),
        )
        .catch(console.error);
    }
  }, [isOpen]);

  // DataType 変更時にカスタムフィールドを再取得
  useEffect(() => {
    if (isOpen && dataTypeId) {
      fetch(`/api/custom-fields?active=true&dataTypeId=${dataTypeId}`)
        .then((res) => res.json())
        .then((data) => setCustomFieldDefs(data))
        .catch(console.error);
    }
  }, [isOpen, dataTypeId]);

  useEffect(() => {
    if (record) {
      setMemberId(String(record.userId));
      setEditValue(String(record.value));
      setMemo(record.description || '');
      const d = new Date(record.recordDate);
      setOrderDate(d.toISOString().slice(0, 16));
      setCustomFieldValues(record.customFields || {});
      setDataTypeId(record.dataTypeId ? String(record.dataTypeId) : '');
    }
  }, [record]);

  const handleSubmit = async () => {
    if (!record || !memberId) return;

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

    const filteredCustomFields: Record<string, string | number> = {};
    for (const [key, val] of Object.entries(customFieldValues)) {
      if (typeof val === 'number') {
        if (Number.isFinite(val)) filteredCustomFields[key] = val;
      } else if (typeof val === 'string' && val.trim()) {
        filteredCustomFields[key] = val;
      }
    }

    // メイン値0 かつ カスタムフィールドも全て空 の場合はブロック
    const mainValueIsZero = !editValue || parseInt(editValue) === 0;
    if (mainValueIsZero && Object.keys(filteredCustomFields).length === 0) {
      await Dialog.error(
        'メイン値またはサブデータのいずれかを入力してください。',
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          value: parseInt(editValue) || 0,
          description: memo || undefined,
          recordDate: new Date(orderDate).toISOString(),
          customFields: filteredCustomFields,
          dataTypeId: dataTypeId ? Number(dataTypeId) : undefined,
        }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || 'データの更新に失敗しました。');
      }
    } catch {
      await Dialog.error(
        'データの更新に失敗しました。ネットワーク接続を確認してください。',
      );
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
        disabled={submitting || !memberId}
      />
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="データ編集" footer={footer}>
      <div className="space-y-4">
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

        {/* 値 */}
        <div className="flex items-center">
          <label className="w-24 text-sm text-gray-700 text-right pr-4">
            値
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder=""
            />
          </div>
        </div>

        {/* データ種別 */}
        {dataTypes.length > 0 && (
          <div className="flex items-center">
            <label className="w-24 text-sm text-gray-700 text-right pr-4">
              データ種別
            </label>
            <div className="flex-1">
              <Select
                value={dataTypeId}
                onChange={setDataTypeId}
                options={[
                  { value: '', label: '未指定' },
                  ...dataTypes.map((dt) => ({
                    value: String(dt.id),
                    label: dt.name,
                  })),
                ]}
                placeholder="未指定"
              />
            </div>
          </div>
        )}

        {/* 入力日 */}
        <div className="flex items-center">
          <label className="w-24 text-sm text-gray-700 text-right pr-4">
            入力日
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
