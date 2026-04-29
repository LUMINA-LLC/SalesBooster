'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header/Header';
import { Dialog } from '@/components/common/Dialog';
import DropdownMenu from '@/components/common/DropdownMenu';
import EditSalesRecordModal from '@/components/sales/EditSalesRecordModal';
import SalesInputModal from '@/components/SalesInputModal';
import ImportSalesModal from '@/components/sales/ImportSalesModal';
import RecordsFilterBar from '@/components/sales/records/RecordsFilterBar';
import RecordsTable from '@/components/sales/records/RecordsTable';
import {
  formatDate,
  formatDateShort,
  formatRecordValue,
  escapeCsvField,
} from '@/components/sales/records/format';
import type {
  SalesRecord,
  RecordsResponse,
  GroupOption,
  MemberOption,
  DataTypeOption,
} from '@/components/sales/records/types';
import type { CustomFieldDefinition } from '@/types/customField';

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

  const fetchRecords = useCallback(
    async (page: number) => {
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
    },
    [buildFilterParams],
  );

  useEffect(() => {
    fetchRecords(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const bom = '﻿';
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

  const handleDelete = useCallback(
    async (record: SalesRecord) => {
      const confirmed = await Dialog.confirm(
        `${record.memberName}のデータ（値: ${formatRecordValue(record)}）を削除しますか？`,
      );
      if (!confirmed) return;
      try {
        const res = await fetch(`/api/sales/${record.id}`, {
          method: 'DELETE',
        });
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
    },
    [currentPage, fetchRecords],
  );

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

        <RecordsFilterBar
          startDate={startDate}
          endDate={endDate}
          groupId={groupId}
          memberId={memberId}
          filterDataTypeId={filterDataTypeId}
          groups={groups}
          members={members}
          dataTypes={dataTypes}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onGroupChange={setGroupId}
          onMemberChange={setMemberId}
          onDataTypeChange={setFilterDataTypeId}
          onSearch={handleSearch}
        />

        <RecordsTable
          records={records}
          customFieldDefs={customFieldDefs}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={setEditingRecord}
          onDelete={handleDelete}
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
