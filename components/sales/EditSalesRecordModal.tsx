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
import { toLocalDateTime } from '@/lib/dateLocal';
import { getUnitLabel } from '@/lib/units';
import { UNIT_MULTIPLIERS } from '@/types/units';
import type { UnitValue } from '@/types/units';

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

  const selectedDataType = dataTypes.find((dt) => String(dt.id) === dataTypeId);
  const fromDbValue = (dbValue: number, unit: string | undefined): string => {
    const multiplier = unit ? (UNIT_MULTIPLIERS[unit as UnitValue] ?? 1) : 1;
    if (multiplier === 1) return String(dbValue);
    return String(dbValue / multiplier);
  };

  useEffect(() => {
    if (record) {
      setMemberId(String(record.userId));
      setMemo(record.description || '');
      const d = new Date(record.recordDate);
      setOrderDate(toLocalDateTime(d));
      setCustomFieldValues(record.customFields || {});
      setDataTypeId(record.dataTypeId ? String(record.dataTypeId) : '');
      setEditValue(String(record.value));
    }
  }, [record]);

  useEffect(() => {
    if (record && dataTypes.length > 0) {
      const dt = dataTypes.find((d) => d.id === record.dataTypeId);
      setEditValue(fromDbValue(record.value, dt?.unit));
    }
  }, [record, dataTypes]);

  useEffect(() => {
    if (!record || customFieldDefs.length === 0) return;
    const rawCf = record.customFields || {};
    const converted: CustomFieldValues = {};
    for (const [key, val] of Object.entries(rawCf)) {
      const def = customFieldDefs.find((f) => String(f.id) === key);
      if (def && def.aggregatable && def.unit) {
        const m = UNIT_MULTIPLIERS[def.unit as UnitValue] ?? 1;
        const num = typeof val === 'number' ? val : Number(val);
        if (Number.isFinite(num) && m !== 1) {
          converted[key] = num / m;
          continue;
        }
      }
      converted[key] = val;
    }
    setCustomFieldValues(converted);
  }, [record, customFieldDefs]);

  /**
   * データ更新処理
   * - メイン値とカスタムフィールドの両方が空（0や空文字）の場合はエラー
   * - カスタムフィールドのうち、集計対象かつ単位ありのものは、送信前に単位を乗算してDB保存用の値に変換
   * @returns
   */
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

    const fieldMultiplier = (fieldId: string): number => {
      const def = customFieldDefs.find((f) => String(f.id) === fieldId);
      if (!def || !def.aggregatable || !def.unit) return 1;
      return UNIT_MULTIPLIERS[def.unit as UnitValue] ?? 1;
    };
    const filteredCustomFields: Record<string, string | number> = {};
    for (const [key, val] of Object.entries(customFieldValues)) {
      if (typeof val === 'number') {
        if (Number.isFinite(val)) {
          filteredCustomFields[key] = val * fieldMultiplier(key);
        }
      } else if (typeof val === 'string' && val.trim()) {
        const m = fieldMultiplier(key);
        if (m !== 1) {
          const n = Number(val);
          filteredCustomFields[key] = Number.isFinite(n) ? n * m : val;
        } else {
          filteredCustomFields[key] = val;
        }
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

    const raw = parseInt(editValue) || 0;
    const unit = selectedDataType?.unit as UnitValue | undefined;
    const multiplier = unit ? (UNIT_MULTIPLIERS[unit] ?? 1) : 1;
    const submitValue = raw * multiplier;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          value: submitValue,
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
            {selectedDataType?.name || '値'}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder=""
            />
            {selectedDataType?.unit && (
              <span className="text-sm text-blue-600">
                {getUnitLabel(selectedDataType.unit)}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
              title="このフィールドは集計対象です"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3 h-3"
                aria-hidden="true"
              >
                <path d="M2 13a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1Zm4-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9Zm4-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V4Z" />
              </svg>
              集計対象
            </span>
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
