'use client';

import { useState, useEffect } from 'react';
import ImportModal, {
  ImportField,
  MappedRow,
  PreviewColumn,
  ParsedRow,
} from '@/components/common/ImportModal';
import Select from '@/components/common/Select';
import type { DataTypeInfo } from '@/types';
import { UNIT_MULTIPLIERS, type UnitValue } from '@/types/units';

interface Member {
  id: string;
  name: string;
}

interface ImportTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  dataTypes: DataTypeInfo[];
  members: Member[];
}

/** 名前の比較用にすべての空白文字を除去して正規化 */
function normalizeName(name: string): string {
  return name.replace(/[\s\u3000\u00A0\u200B\uFEFF]+/g, '').normalize('NFC');
}

/** yyyyMM 形式を year と month に分解 */
function parseYearMonth(value: string): { year: number; month: number } | null {
  const trimmed = value.trim().replace(/[/-]/g, '');
  if (!/^\d{6}$/.test(trimmed)) return null;
  const year = Number(trimmed.slice(0, 4));
  const month = Number(trimmed.slice(4, 6));
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
  return { year, month };
}

const FIELDS: ImportField[] = [
  {
    value: 'memberName',
    label: '従業員名 *',
    required: true,
    autoMapKeywords: [
      '従業員名',
      'メンバー',
      '名前',
      'name',
      '担当',
      '営業',
      '氏名',
    ],
  },
  {
    value: 'targetValue',
    label: '目標値 *',
    required: true,
    autoMapKeywords: ['目標', 'target', '粗利目標', '媒介数目標'],
  },
  {
    value: 'yearMonth',
    label: '年月 *',
    required: true,
    autoMapKeywords: ['年月', 'yyyymm', '期間', 'period', 'date'],
  },
];

const PREVIEW_COLUMNS: PreviewColumn[] = [
  {
    key: 'memberName',
    label: '従業員名',
    render: (row: MappedRow) =>
      row.memberName || <span className="text-red-400">-</span>,
  },
  {
    key: 'targetValue',
    label: '目標値',
    render: (row: MappedRow) => {
      const val = row.targetValue;
      return val ? Number(val).toLocaleString() : '-';
    },
  },
  {
    key: 'yearMonthDisplay',
    label: '年月',
    render: (row: MappedRow) =>
      row.yearMonthDisplay || <span className="text-red-400">-</span>,
  },
];

export default function ImportTargetsModal({
  isOpen,
  onClose,
  onImported,
  dataTypes,
  members,
}: ImportTargetsModalProps) {
  const [selectedDataTypeId, setSelectedDataTypeId] = useState<string>('');

  useEffect(() => {
    if (isOpen && !selectedDataTypeId && dataTypes.length > 0) {
      const defaultType = dataTypes.find((d) => d.isDefault);
      if (defaultType) setSelectedDataTypeId(String(defaultType.id));
      else setSelectedDataTypeId(String(dataTypes[0].id));
    }
  }, [isOpen, dataTypes, selectedDataTypeId]);

  const buildMappedData = (
    rows: ParsedRow[],
    mapping: Record<string, string>,
  ): MappedRow[] => {
    const nameHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'memberName',
    );
    const targetHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'targetValue',
    );
    const ymHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'yearMonth',
    );

    return rows.map((row) => {
      const rawName = nameHeader ? row[nameHeader].trim() : '';
      const rawTarget = targetHeader ? row[targetHeader].trim() : '';
      const rawYm = ymHeader ? row[ymHeader].trim() : '';

      const errors: string[] = [];

      if (!rawName) errors.push('従業員名が未入力');
      const normalizedRawName = normalizeName(rawName);
      const member = members.find(
        (m) => normalizeName(m.name) === normalizedRawName,
      );
      if (rawName && !member)
        errors.push(`メンバー「${rawName}」が見つかりません`);

      const targetNum = Number(rawTarget.replace(/,/g, ''));
      if (!rawTarget) errors.push('目標値が未入力');
      else if (isNaN(targetNum)) errors.push('目標値が不正');

      const ym = parseYearMonth(rawYm);
      if (!rawYm) errors.push('年月が未入力');
      else if (!ym) errors.push(`年月「${rawYm}」が不正（yyyyMM形式）`);

      return {
        memberName: rawName,
        memberId: member ? String(member.id) : undefined,
        targetValue: !isNaN(targetNum) ? String(targetNum) : undefined,
        yearMonth: ym
          ? `${ym.year}${String(ym.month).padStart(2, '0')}`
          : undefined,
        yearMonthDisplay: ym ? `${ym.year}年${ym.month}月` : rawYm,
        year: ym ? String(ym.year) : undefined,
        month: ym ? String(ym.month) : undefined,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      } as MappedRow;
    });
  };

  const handleImport = async (validRows: MappedRow[]) => {
    // 選択中データ種別の単位から multiplier を取得 (表示単位値 → DBの生値)
    const dt = dataTypes.find((d) => String(d.id) === selectedDataTypeId);
    const unit = dt?.unit as UnitValue | undefined;
    const multiplier = unit ? (UNIT_MULTIPLIERS[unit] ?? 1) : 1;

    // 年ごとにグルーピングしてバルクupsert
    const byYear: Record<
      number,
      { userId: string; month: number; value: number }[]
    > = {};

    for (const row of validRows) {
      if (
        !row.memberId ||
        !row.year ||
        !row.month ||
        row.targetValue === undefined
      )
        continue;
      const y = Number(row.year);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push({
        userId: row.memberId,
        month: Number(row.month),
        value: Number(row.targetValue) * multiplier,
      });
    }

    let totalUpdated = 0;
    for (const [yearStr, targets] of Object.entries(byYear)) {
      const res = await fetch('/api/targets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets,
          year: Number(yearStr),
          ...(selectedDataTypeId
            ? { dataTypeId: Number(selectedDataTypeId) }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || `${yearStr}年の目標インポートに失敗しました。`,
        );
      }

      const result = await res.json();
      totalUpdated += result.updated || 0;
    }

    return {
      message: `インポート完了: ${totalUpdated}件の目標を設定しました。`,
    };
  };

  return (
    <ImportModal
      isOpen={isOpen}
      onClose={onClose}
      onImported={onImported}
      titlePrefix="個人目標"
      fields={FIELDS}
      previewColumns={PREVIEW_COLUMNS}
      buildMappedData={buildMappedData}
      onImport={handleImport}
      headerContent={
        dataTypes.length > 0 ? (
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
        ) : undefined
      }
    />
  );
}
