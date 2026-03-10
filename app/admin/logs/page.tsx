'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  action: string;
  detail: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
  tenant: { name: string };
}

interface Tenant {
  id: number;
  name: string;
}

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'ログイン',
  USER_LOGOUT: 'ログアウト',
  USER_CREATE: 'ユーザー作成',
  USER_UPDATE: 'ユーザー更新',
  USER_DELETE: 'ユーザー削除',
  GROUP_CREATE: 'グループ作成',
  GROUP_UPDATE: 'グループ更新',
  GROUP_DELETE: 'グループ削除',
  SALES_CREATE: '売上登録',
  SALES_UPDATE: '売上更新',
  SALES_DELETE: '売上削除',
  TARGET_CREATE: '目標作成',
  TARGET_UPDATE: '目標更新',
  TARGET_DELETE: '目標削除',
  SETTINGS_UPDATE: '設定更新',
  TENANT_CREATE: 'テナント作成',
  TENANT_UPDATE: 'テナント更新',
  TENANT_DELETE: 'テナント削除',
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // フィルター
  const [filterTenantId, setFilterTenantId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    fetch('/api/tenants')
      .then((res) => res.json())
      .then((data) => setTenants(Array.isArray(data) ? data : data?.data ?? []))
      .catch(console.error);
  }, []);

  const fetchLogs = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (filterTenantId) params.set('tenantId', filterTenantId);
      if (filterAction) params.set('action', filterAction);
      if (filterStartDate) params.set('startDate', filterStartDate);
      if (filterEndDate) params.set('endDate', filterEndDate);

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filterTenantId, filterAction, filterStartDate, filterEndDate]);

  const actionOptions = Object.entries(ACTION_LABELS);

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">監査ログ</h2>
        <span className="text-sm text-gray-500">{total.toLocaleString()} 件</span>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">テナント</label>
            <select
              value={filterTenantId}
              onChange={(e) => setFilterTenantId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">アクション</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {actionOptions.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">開始日</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">終了日</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ログテーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500 text-sm">読み込み中...</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">テナント</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">アクション</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">ログがありません</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.tenant.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.user.name || log.user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.detail || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => fetchLogs(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      )}
    </main>
  );
}
