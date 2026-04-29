'use client';

import { useMemo } from 'react';
import DataTable, { Column } from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import type { CustomFieldDefinition } from '@/types/customField';
import type { SalesRecord } from './types';
import { formatDate, formatRecordValue } from './format';

interface RecordsTableProps {
  records: SalesRecord[];
  customFieldDefs: CustomFieldDefinition[];
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (record: SalesRecord) => void;
  onDelete: (record: SalesRecord) => void;
}

export default function RecordsTable({
  records,
  customFieldDefs,
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}: RecordsTableProps) {
  const columns: Column<SalesRecord>[] = useMemo(() => {
    const fixedColumns: Column<SalesRecord>[] = [
      {
        key: 'recordDate',
        label: '入力日',
        render: (r) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {formatDate(r.recordDate)}
          </span>
        ),
      },
      {
        key: 'memberName',
        label: 'メンバー',
        render: (r) => (
          <span className="text-sm font-medium text-gray-800">
            {r.memberName}
          </span>
        ),
      },
      {
        key: 'department',
        label: '部署',
        render: (r) => (
          <span className="text-sm text-gray-600">{r.department || '-'}</span>
        ),
      },
      {
        key: 'value',
        label: '値',
        align: 'right',
        render: (r) => (
          <span className="text-sm font-medium text-gray-800">
            {formatRecordValue(r)}
          </span>
        ),
      },
      {
        key: 'dataType',
        label: 'データ種別',
        render: (r) => (
          <span className="text-sm text-gray-600">
            {r.dataType?.name || '-'}
          </span>
        ),
      },
      {
        key: 'description',
        label: '備考',
        render: (r) => (
          <span className="text-sm text-gray-500 truncate max-w-[200px] block">
            {r.description || '-'}
          </span>
        ),
      },
    ];

    const dynamicColumns: Column<SalesRecord>[] = customFieldDefs.map(
      (field) => ({
        key: `cf_${field.id}`,
        label: field.name,
        render: (r: SalesRecord) => (
          <span className="text-sm text-gray-600">
            {r.customFields?.[String(field.id)] || '-'}
          </span>
        ),
      }),
    );

    const actionsColumn: Column<SalesRecord> = {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            label="編集"
            variant="outline"
            color="blue"
            onClick={() => onEdit(r)}
            className="px-3 py-1.5 text-xs"
          />
          <Button
            label="削除"
            variant="outline"
            color="red"
            onClick={() => onDelete(r)}
            className="px-3 py-1.5 text-xs"
          />
        </div>
      ),
    };

    return [...fixedColumns, ...dynamicColumns, actionsColumn];
  }, [customFieldDefs, onEdit, onDelete]);

  return (
    <DataTable
      data={records}
      columns={columns}
      keyField="id"
      emptyMessage="データがありません"
      serverPagination={{
        currentPage,
        totalPages,
        total,
        pageSize,
        onPageChange,
      }}
      mobileRender={(r) => (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-800">
              {r.memberName}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(r.recordDate)}
            </span>
          </div>
          {r.department && (
            <div className="text-xs text-gray-500 mb-1">{r.department}</div>
          )}
          <div className="text-sm font-bold text-gray-800 mb-1">
            {formatRecordValue(r)}
          </div>
          {r.description && (
            <div className="text-xs text-gray-500 mb-1">{r.description}</div>
          )}
          {customFieldDefs.length > 0 && r.customFields && (
            <div className="text-xs text-gray-500 mb-1 space-y-0.5">
              {customFieldDefs.map((field) => {
                const val = r.customFields?.[String(field.id)];
                return val ? (
                  <div key={field.id}>
                    <span className="text-gray-400">{field.name}:</span> {val}
                  </div>
                ) : null;
              })}
            </div>
          )}
          <div className="flex items-center space-x-2 mt-2">
            <Button
              label="編集"
              variant="outline"
              color="blue"
              onClick={() => onEdit(r)}
              className="px-3 py-1.5 text-xs"
            />
            <Button
              label="削除"
              variant="outline"
              color="red"
              onClick={() => onDelete(r)}
              className="px-3 py-1.5 text-xs"
            />
          </div>
        </div>
      )}
    />
  );
}
