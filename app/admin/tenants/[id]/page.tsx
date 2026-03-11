'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import EditTenantModal from '@/components/admin/EditTenantModal';
import BasicInfoTab from '@/components/admin/tenant-detail/BasicInfoTab';
import LicenseTab from '@/components/admin/tenant-detail/LicenseTab';
import StatsTab from '@/components/admin/tenant-detail/StatsTab';
import AdminsTab from '@/components/admin/tenant-detail/AdminsTab';
import HistoryTab from '@/components/admin/tenant-detail/HistoryTab';
import { TenantDetail } from '@/components/admin/tenant-detail/types';

type TabKey = 'basic' | 'license' | 'stats' | 'admins' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'basic', label: '基本情報' },
  { key: 'license', label: '契約・ライセンス' },
  { key: 'stats', label: '統計情報' },
  { key: 'admins', label: '管理者' },
  { key: 'history', label: '契約履歴' },
];

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = Number(params.id);
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchTenant = () => {
    setLoading(true);
    fetch(`/api/tenants/${tenantId}`)
      .then((res) => res.json())
      .then((data) => setTenant(data?.data ?? data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tenantId) fetchTenant();
  }, [tenantId]);

  if (loading) {
    return (
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-center py-24">
          <span className="text-gray-500">読み込み中...</span>
        </div>
      </main>
    );
  }

  if (!tenant) {
    return (
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-center py-24">
          <span className="text-gray-500">テナントが見つかりません</span>
        </div>
      </main>
    );
  }

  const tabContent: Record<TabKey, React.ReactNode> = {
    basic: <BasicInfoTab tenant={tenant} />,
    license: <LicenseTab tenant={tenant} />,
    stats: <StatsTab tenant={tenant} />,
    admins: <AdminsTab tenant={tenant} />,
    history: <HistoryTab tenant={tenant} />,
  };

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="戻る"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{tenant.name}</h2>
            <p className="text-sm text-gray-500 font-mono">{tenant.slug}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {tenant.isActive ? '有効' : '無効'}
          </span>
        </div>
        <Button label="編集" onClick={() => setEditModalOpen(true)} />
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      {tabContent[activeTab]}

      {/* 編集モーダル */}
      <EditTenantModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdated={fetchTenant}
        tenantId={tenantId}
      />
    </main>
  );
}
