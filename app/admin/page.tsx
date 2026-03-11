'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import DataTable, { Column } from '@/components/common/DataTable';
import { Dialog } from '@/components/common/Dialog';
import CreateTenantModal from '@/components/admin/CreateTenantModal';
import EditTenantModal from '@/components/admin/EditTenantModal';

const PLAN_TYPE_LABELS: Record<string, string> = {
  TRIAL: 'トライアル',
  STANDARD: 'スタンダード',
  ENTERPRISE: 'エンタープライズ',
};

interface Tenant {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  planType: string | null;
  maxMembers: number | null;
  licenseEndDate: string | null;
  isTrial: boolean;
  createdAt: string;
  _count: { users: number };
}

function getLicenseBadge(t: Tenant) {
  if (!t.licenseEndDate) {
    return <span className="text-xs text-gray-400">未設定</span>;
  }
  const end = new Date(t.licenseEndDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (now > end) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">期限切れ</span>;
  }
  if (days <= 7) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">残{days}日</span>;
  }
  if (t.isTrial) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">トライアル</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">有効</span>;
}

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
          onClick={() => router.push(`/admin/tenants/${t.id}`)}
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
      key: 'planType',
      label: 'プラン',
      render: (t) => (
        <span className="text-sm text-gray-600">
          {t.planType ? PLAN_TYPE_LABELS[t.planType] || t.planType : '-'}
        </span>
      ),
    },
    {
      key: 'license',
      label: 'ライセンス',
      render: (t) => getLicenseBadge(t),
    },
    {
      key: 'users',
      label: 'ユーザー数',
      align: 'right',
      render: (t) => (
        <span className="text-sm text-gray-600">
          {t._count.users}{t.maxMembers !== null ? ` / ${t.maxMembers}` : ''}
        </span>
      ),
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
                onClick={() => router.push(`/admin/tenants/${t.id}`)}
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
            <div className="text-xs text-gray-400 mb-1">
              プラン: {t.planType ? PLAN_TYPE_LABELS[t.planType] || t.planType : '未設定'} / {getLicenseBadge(t)}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              ユーザー: {t._count.users}{t.maxMembers !== null ? ` / ${t.maxMembers}` : ''} / 作成日: {formatDate(t.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                label="詳細"
                variant="outline"
                color="blue"
                onClick={() => router.push(`/admin/tenants/${t.id}`)}
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

      <EditTenantModal
        isOpen={editTenantId !== null}
        onClose={() => setEditTenantId(null)}
        onUpdated={fetchTenants}
        tenantId={editTenantId}
      />
    </main>
  );
}
