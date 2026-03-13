'use client';

import { useState, useEffect } from 'react';

interface SubscriptionHistory {
  id: number;
  tenantId: number;
  action: string;
  planType: string | null;
  maxMembers: number | null;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
  createdAt: string;
  tenant: { name: string };
}

interface Tenant {
  id: number;
  name: string;
}

const ACTION_LABELS: Record<string, string> = {
  TRIAL_START: 'トライアル開始',
  CREATE: '契約作成',
  UPDATE: '契約更新',
  RENEW: '契約更新',
  EXPIRE: '期限切れ',
};

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'トライアル',
  STANDARD: 'スタンダード',
  ENTERPRISE: 'エンタープライズ',
};

const ACTION_COLORS: Record<string, string> = {
  TRIAL_START: 'bg-blue-100 text-blue-800',
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  RENEW: 'bg-green-100 text-green-800',
  EXPIRE: 'bg-red-100 text-red-800',
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminSubscriptionsPage() {
  const [histories, setHistories] = useState<SubscriptionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterTenantId, setFilterTenantId] = useState('');

  useEffect(() => {
    fetch('/api/tenants')
      .then((res) => res.json())
      .then((data) =>
        setTenants(Array.isArray(data) ? data : (data?.data ?? [])),
      )
      .catch(console.error);
  }, []);

  const fetchHistories = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (filterTenantId) params.set('tenantId', filterTenantId);

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setHistories(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch (err) {
      console.error('Failed to fetch subscription histories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistories(1);
  }, [filterTenantId]);

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">契約履歴</h2>
        <span className="text-sm text-gray-500">
          {total.toLocaleString()} 件
        </span>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              テナント
            </label>
            <select
              value={filterTenantId}
              onChange={(e) => setFilterTenantId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500 text-sm">読み込み中...</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  日時
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  テナント
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  アクション
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  プラン
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  メンバー上限
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  期間
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  備考
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {histories.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-gray-400 text-sm"
                  >
                    履歴がありません
                  </td>
                </tr>
              ) : (
                histories.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDateTime(h.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {h.tenant.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[h.action] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {ACTION_LABELS[h.action] || h.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {h.planType ? PLAN_LABELS[h.planType] || h.planType : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {h.maxMembers !== null ? `${h.maxMembers}人` : '無制限'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {h.startDate || h.endDate
                        ? `${formatDate(h.startDate)} 〜 ${formatDate(h.endDate)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {h.note || '-'}
                    </td>
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
            onClick={() => fetchHistories(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => fetchHistories(page + 1)}
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
