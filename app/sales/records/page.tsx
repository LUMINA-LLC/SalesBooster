'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/header/Header';
import DataTable, { Column } from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';
import DropdownMenu from '@/components/common/DropdownMenu';
import EditSalesRecordModal from '@/components/sales/EditSalesRecordModal';
import SalesInputModal from '@/components/SalesInputModal';
import ImportSalesModal from '@/components/sales/ImportSalesModal';
import type { CustomFieldDefinition } from '@/types/customField';
import { convertByUnit, formatNumber } from '@/lib/currency';
import { getUnitLabel } from '@/lib/units';

interface SalesRecord {
  id: number;
  userId: string;
  memberName: string;
  department: string | null;
  value: number;
  dataTypeId: number | null;
  dataType: { id: number; name: string; unit: string } | null;
  description: string | null;
  customFields: Record<string, string> | null;
  recordDate: string;
  createdAt: string;
}

interface RecordsResponse {
  records: SalesRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface GroupOption {
  id: number;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface DataTypeOption {
  id: number;
  name: string;
}

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

const formatDateShort = (isoDate: string) => {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
};

/** レコード値をデータ種別の単位で表示用にフォーマット */
const formatRecordValue = (record: SalesRecord): string => {
  const unit = record.dataType?.unit;
  const converted = unit ? convertByUnit(record.value, unit) : record.value;
  const label = unit ? getUnitLabel(unit) : '';
  return `${formatNumber(converted)}${label}`;
};

const escapeCsvField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export default function SalesRecordsPage() {
  const [data, setData] = useState<RecordsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupId, setGroupId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [exporting, setExporting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<
    CustomFieldDefinition[]
  >([]);
  const [dataTypes, setDataTypes] = useState<DataTypeOption[]>([]);
  const [filterDataTypeId, setFilterDataTypeId] = useState('');
  const pageSize = 10;

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (memberId) {
      params.set('memberId', memberId);
    } else if (groupId) {
      params.set('groupId', groupId);
    }
    if (filterDataTypeId) params.set('dataTypeId', filterDataTypeId);
    return params;
  }, [startDate, endDate, groupId, memberId, filterDataTypeId]);

  const fetchRecords = async (page: number) => {
    setLoading(true);
    try {
      setFetchError(null);
      const params = buildFilterParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`/api/sales/records?${params}`);
      if (res.ok) setData(await res.json());
      else setFetchError('データの取得に失敗しました。');
    } catch {
      setFetchError(
        'データの取得に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(currentPage);
  }, [currentPage]);

  useEffect(() => {
    // グループ・メンバー一覧を取得
    fetch('/api/groups')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setGroups(
          list.map((g: { id: number; name: string }) => ({
            id: g.id,
            name: g.name,
          })),
        );
      })
      .catch(console.error);
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setMembers(
          list.map((m: { id: number; name: string }) => ({
            id: m.id,
            name: m.name,
          })),
        );
      })
      .catch(console.error);
    fetch('/api/custom-fields?active=true')
      .then((res) => res.json())
      .then((data) => setCustomFieldDefs(data))
      .catch(console.error);
    fetch('/api/data-types')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setDataTypes(
          list.map((d: { id: number; name: string }) => ({
            id: d.id,
            name: d.name,
          })),
        );
      })
      .catch(console.error);
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = buildFilterParams();
      const res = await fetch(`/api/sales/records/export?${params}`);
      if (!res.ok) {
        await Dialog.error('エクスポートに失敗しました。');
        return;
      }
      const json = await res.json();
      const records: SalesRecord[] = Array.isArray(json)
        ? json
        : (json?.data ?? []);

      if (records.length === 0) {
        await Dialog.error('エクスポートするデータがありません。');
        return;
      }

      // カスタムフィールドのヘッダーを収集
      const cfHeaders = customFieldDefs.map((f) => f.name);

      const headerRow = [
        'ID',
        '日付',
        'メンバー名',
        '部署',
        '金額',
        '備考',
        ...cfHeaders,
        '入力日時',
      ];
      const csvRows = [headerRow.map(escapeCsvField).join(',')];

      for (const r of records) {
        const cfValues = customFieldDefs.map(
          (f) => r.customFields?.[String(f.id)] || '',
        );
        const row = [
          String(r.id),
          formatDateShort(r.recordDate),
          r.memberName,
          r.department || '',
          String(r.value),
          r.description || '',
          ...cfValues,
          formatDate(r.createdAt),
        ];
        csvRows.push(row.map(escapeCsvField).join(','));
      }

      const bom = '\uFEFF';
      const csvContent = bom + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const fileName = `データ_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      await Dialog.error(
        'エクスポートに失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (record: SalesRecord) => {
    const confirmed = await Dialog.confirm(
      `${record.memberName}のデータ（値: ${formatRecordValue(record)}）を削除しますか？`,
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/sales/${record.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecords(currentPage);
      } else {
        const d = await res.json().catch(() => null);
        await Dialog.error(d?.error || 'データの削除に失敗しました。');
      }
    } catch {
      await Dialog.error(
        'データの削除に失敗しました。ネットワーク接続を確認してください。',
      );
    }
  };

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
            onClick={() => setEditingRecord(r)}
            className="px-3 py-1.5 text-xs"
          />
          <Button
            label="削除"
            variant="outline"
            color="red"
            onClick={() => handleDelete(r)}
            className="px-3 py-1.5 text-xs"
          />
        </div>
      ),
    };

    return [...fixedColumns, ...dynamicColumns, actionsColumn];
  }, [customFieldDefs]);

  if (loading && !data) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <Header subtitle="データ管理" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (fetchError && !data) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <Header subtitle="データ管理" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-3">{fetchError}</div>
            <button
              onClick={() => fetchRecords(currentPage)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  const records = data?.records || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const groupOptions = [
    { value: '', label: 'すべてのグループ' },
    ...groups.map((g) => ({ value: String(g.id), label: g.name })),
  ];
  const memberOptions = [
    { value: '', label: 'すべてのメンバー' },
    ...members.map((m) => ({ value: String(m.id), label: m.name })),
  ];
  const dataTypeOptions = [
    { value: '', label: 'すべてのデータ種別' },
    ...dataTypes.map((d) => ({ value: String(d.id), label: d.name })),
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header subtitle="データ管理" />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">データ管理</h2>
          <DropdownMenu
            items={[
              {
                label: 'データ入力',
                icon: (
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                ),
                onClick: () => setIsSalesModalOpen(true),
              },
              {
                label: 'インポート',
                icon: (
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                ),
                onClick: () => setIsImportModalOpen(true),
              },
              {
                label: exporting ? 'エクスポート中...' : 'CSVエクスポート',
                icon: (
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                ),
                onClick: handleExportCsv,
              },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
          />
          <span className="text-gray-500 shrink-0">&mdash;</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
          />
          <Select
            value={groupId}
            onChange={(v) => {
              setGroupId(v);
              if (v) setMemberId('');
            }}
            options={groupOptions}
            placeholder="グループ"
            className="w-full sm:w-44"
          />
          <Select
            value={memberId}
            onChange={(v) => {
              setMemberId(v);
              if (v) setGroupId('');
            }}
            options={memberOptions}
            placeholder="メンバー"
            className="w-full sm:w-44"
          />
          <Select
            value={filterDataTypeId}
            onChange={setFilterDataTypeId}
            options={dataTypeOptions}
            placeholder="データ種別"
            className="w-full sm:w-44"
          />
          <Button label="検索" onClick={handleSearch} className="shrink-0" />
        </div>

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
            onPageChange: setCurrentPage,
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
                <div className="text-xs text-gray-500 mb-1">
                  {r.description}
                </div>
              )}
              {customFieldDefs.length > 0 && r.customFields && (
                <div className="text-xs text-gray-500 mb-1 space-y-0.5">
                  {customFieldDefs.map((field) => {
                    const val = r.customFields?.[String(field.id)];
                    return val ? (
                      <div key={field.id}>
                        <span className="text-gray-400">{field.name}:</span>{' '}
                        {val}
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
                  onClick={() => setEditingRecord(r)}
                  className="px-3 py-1.5 text-xs"
                />
                <Button
                  label="削除"
                  variant="outline"
                  color="red"
                  onClick={() => handleDelete(r)}
                  className="px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          )}
        />
      </main>

      <EditSalesRecordModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onUpdated={() => fetchRecords(currentPage)}
        record={editingRecord}
      />

      <SalesInputModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        onSubmit={() => {
          setIsSalesModalOpen(false);
          fetchRecords(currentPage);
        }}
      />

      <ImportSalesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={() => fetchRecords(currentPage)}
      />
    </div>
  );
}
