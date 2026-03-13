'use client';

import { useState, useMemo } from 'react';
import ImportModal, {
  ImportField,
  MappedRow,
  PreviewColumn,
  ParsedRow,
} from '@/components/common/ImportModal';
import type { CustomFieldDefinition } from '@/types/customField';

interface Member {
  id: string;
  name: string;
}

interface ImportSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

const FIXED_FIELDS: ImportField[] = [
  {
    value: 'memberName',
    label: 'メンバー名 *',
    required: true,
    autoMapKeywords: ['メンバー', '名前', 'name', '担当', '営業'],
  },
  {
    value: 'value',
    label: '値 *',
    required: true,
    autoMapKeywords: ['金額', '売上', 'amount', '粗利', '値', 'value'],
  },
  {
    value: 'recordDate',
    label: '入力日 *',
    required: true,
    autoMapKeywords: ['入力日', '日付', 'date', '契約日'],
  },
  {
    value: 'description',
    label: '備考',
    required: false,
    autoMapKeywords: ['備考', 'memo', 'description', 'メモ', '説明'],
  },
];

const FIXED_PREVIEW_COLUMNS: PreviewColumn[] = [
  {
    key: 'memberName',
    label: 'メンバー',
    render: (row) => row.memberName || <span className="text-red-400">-</span>,
  },
  {
    key: 'value',
    label: '値',
    render: (row) => row.value || <span className="text-red-400">-</span>,
  },
  {
    key: 'recordDate',
    label: '入力日',
    render: (row) => row.recordDate || <span className="text-red-400">-</span>,
  },
  {
    key: 'description',
    label: '備考',
    render: (row) => row.description || '-',
  },
];

function parseDate(value: string): Date | null {
  if (!value) return null;
  // ISO形式 or yyyy/mm/dd or yyyy-mm-dd
  const d = new Date(value.replace(/\//g, '-'));
  if (!isNaN(d.getTime())) return d;
  return null;
}

export default function ImportSalesModal({
  isOpen,
  onClose,
  onImported,
}: ImportSalesModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<
    CustomFieldDefinition[]
  >([]);

  const fields: ImportField[] = useMemo(() => {
    const dynamicFields: ImportField[] = customFieldDefs.map((field) => ({
      value: `cf_${field.id}`,
      label: `${field.name}${field.isRequired ? ' *' : ''}`,
      required: field.isRequired,
      autoMapKeywords: [field.name],
    }));
    return [...FIXED_FIELDS, ...dynamicFields];
  }, [customFieldDefs]);

  const previewColumns: PreviewColumn[] = useMemo(() => {
    const dynamicColumns: PreviewColumn[] = customFieldDefs.map((field) => ({
      key: `cf_${field.id}`,
      label: field.name,
      render: (row: MappedRow) => row[`cf_${field.id}`] || '-',
    }));
    return [...FIXED_PREVIEW_COLUMNS, ...dynamicColumns];
  }, [customFieldDefs]);

  const handleOpen = () => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => setMembers(data))
      .catch(console.error);
    fetch('/api/custom-fields?active=true')
      .then((res) => res.json())
      .then((data) => setCustomFieldDefs(data))
      .catch(console.error);
  };

  const buildMappedData = (
    rows: ParsedRow[],
    mapping: Record<string, string>,
  ): MappedRow[] => {
    const memberNameHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'memberName',
    );
    const valueHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'value',
    );
    const dateHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'recordDate',
    );
    const descHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'description',
    );

    return rows.map((row) => {
      const rawName = memberNameHeader ? row[memberNameHeader].trim() : '';
      const rawValue = valueHeader ? row[valueHeader].trim() : '';
      const rawDate = dateHeader ? row[dateHeader].trim() : '';
      const desc = descHeader ? row[descHeader].trim() : '';

      const errors: string[] = [];

      if (!rawName) errors.push('メンバー名が未入力');
      const member = members.find((m) => m.name === rawName);
      if (rawName && !member)
        errors.push(`メンバー「${rawName}」が見つかりません`);

      if (!rawValue) errors.push('値が未入力');

      const date = parseDate(rawDate);
      if (!rawDate) errors.push('入力日が未入力');
      else if (!date) errors.push(`入力日「${rawDate}」が不正`);

      // カスタムフィールド値を収集
      const cfValues: Record<string, string> = {};
      for (const field of customFieldDefs) {
        const cfKey = `cf_${field.id}`;
        const cfHeader = Object.keys(mapping).find((k) => mapping[k] === cfKey);
        const cfVal = cfHeader ? row[cfHeader].trim() : '';
        if (cfVal) cfValues[cfKey] = cfVal;
        if (field.isRequired && !cfVal) errors.push(`${field.name}が未入力`);
      }

      return {
        memberName: rawName,
        memberId: member ? String(member.id) : undefined,
        value: rawValue || undefined,
        recordDate: date ? date.toISOString() : undefined,
        description: desc || undefined,
        ...cfValues,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      } as MappedRow;
    });
  };

  const handleImport = async (validRows: MappedRow[]) => {
    const payload = validRows.map((row) => {
      const customFields: Record<string, string> = {};
      for (const field of customFieldDefs) {
        const val = row[`cf_${field.id}`];
        if (val) customFields[String(field.id)] = val;
      }

      return {
        memberId: row.memberId,
        value: Number(row.value) || 0,
        recordDate: row.recordDate!,
        description: row.description || undefined,
        ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
      };
    });

    const res = await fetch('/api/sales/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: payload }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'インポートに失敗しました。');
    }

    const result = await res.json();
    return {
      message: `インポート完了: ${result.created}件のデータを追加しました。`,
    };
  };

  return (
    <ImportModal
      isOpen={isOpen}
      onClose={onClose}
      onImported={onImported}
      titlePrefix="データ"
      fields={fields}
      previewColumns={previewColumns}
      buildMappedData={buildMappedData}
      onImport={handleImport}
      onOpen={handleOpen}
    />
  );
}
