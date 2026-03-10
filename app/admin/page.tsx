'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/common/Button';
import DataTable, { Column } from '@/components/common/DataTable';
import { Dialog } from '@/components/common/Dialog';
import CreateTenantModal from '@/components/admin/CreateTenantModal';
import TenantDetailModal from '@/components/admin/TenantDetailModal';
import EditTenantModal from '@/components/admin/EditTenantModal';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number };
}

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailTenantId, setDetailTenantId] = useState<number | null>(null);
  const [editTenantId, setEditTenantId] = useState<number | null>(null);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(Array.isArray(data) ? data : data?.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchTenants();
    }
  }, [status, session]);

  const handleToggleActive = async (tenant: Tenant) => {
    const action = tenant.isActive ? '無効化' : '有効化';
    const confirmed = await Dialog.confirm(`テナント「${tenant.name}」を${action}しますか？`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tenant.isActive }),
      });
      if (res.ok) {
        fetchTenants();
      } else {
        await Dialog.error(`${action}に失敗しました`);
      }
    } catch {
      await Dialog.error('ネットワークエラーが発生しました');
    }
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (t) => <span className="text-sm text-gray-600">{t.id}</span>,
    },
    {
      key: 'name',
      label: 'テナント名',
      render: (t) => (
        <button
          onClick={() => setDetailTenantId(t.id)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {t.name}
        </button>
      ),
    },
    {
      key: 'slug',
      label: '会社アカウント',
      render: (t) => <span className="text-sm text-gray-500 font-mono">{t.slug}</span>,
    },
    {
      key: 'isActive',
      label: 'ステータス',
      render: (t) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {t.isActive ? '有効' : '無効'}
        </span>
      ),
    },
    {
      key: 'users',
      label: 'ユーザー数',
      align: 'right',
      render: (t) => <span className="text-sm text-gray-600">{t._count.users}</span>,
    },
    {
      key: 'createdAt',
      label: '作成日',
      render: (t) => <span className="text-sm text-gray-500">{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            label="編集"
            variant="outline"
            color="blue"
            onClick={() => setEditTenantId(t.id)}
            className="px-3 py-1.5 text-xs"
          />
          <Button
            label={t.isActive ? '無効化' : '有効化'}
            variant="outline"
            color={t.isActive ? 'red' : 'green'}
            onClick={() => handleToggleActive(t)}
            className="px-3 py-1.5 text-xs"
          />
        </div>
      ),
    },
  ];

  if (loading && status !== 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">テナント管理</h2>
        <Button label="テナント追加" onClick={() => setIsCreateModalOpen(true)} />
      </div>

      <DataTable
        data={tenants}
        columns={columns}
        keyField="id"
        emptyMessage="テナントがありません"
        mobileRender={(t) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => setDetailTenantId(t.id)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {t.name}
              </button>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {t.isActive ? '有効' : '無効'}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono mb-1">{t.slug}</div>
            <div className="text-xs text-gray-400 mb-2">
              ユーザー: {t._count.users} / 作成日: {formatDate(t.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                label="詳細"
                variant="outline"
                color="blue"
                onClick={() => setDetailTenantId(t.id)}
                className="px-3 py-1.5 text-xs"
              />
              <Button
                label="編集"
                variant="outline"
                color="blue"
                onClick={() => setEditTenantId(t.id)}
                className="px-3 py-1.5 text-xs"
              />
              <Button
                label={t.isActive ? '無効化' : '有効化'}
                variant="outline"
                color={t.isActive ? 'red' : 'green'}
                onClick={() => handleToggleActive(t)}
                className="px-3 py-1.5 text-xs"
              />
            </div>
          </div>
        )}
      />

      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchTenants}
      />

      <TenantDetailModal
        isOpen={detailTenantId !== null}
        onClose={() => setDetailTenantId(null)}
        tenantId={detailTenantId}
      />

      <EditTenantModal
        isOpen={editTenantId !== null}
        onClose={() => setEditTenantId(null)}
        onUpdated={fetchTenants}
        tenantId={editTenantId}
      />
    </main>
  );
}
