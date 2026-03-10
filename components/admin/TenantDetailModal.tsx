'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface TenantDetail {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    departments: number;
    groups: number;
    salesRecords: number;
    targets: number;
    integrations: number;
  };
  users: { id: string; name: string | null; email: string; createdAt: string }[];
}

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: number | null;
}

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateTime = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${formatDate(isoDate)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function TenantDetailModal({ isOpen, onClose, tenantId }: TenantDetailModalProps) {
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tenantId) {
      setLoading(true);
      fetch(`/api/tenants/${tenantId}`)
        .then((res) => res.json())
        .then((data) => setTenant(data?.data ?? data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, tenantId]);

  const footer = (
    <Button label="閉じる" variant="outline" color="gray" onClick={onClose} />
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="テナント詳細" footer={footer} maxWidth="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500">読み込み中...</span>
        </div>
      ) : !tenant ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500">テナントが見つかりません</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              基本情報
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">テナント名</span>
                <p className="text-sm font-medium text-gray-800">{tenant.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">会社アカウント</span>
                <p className="text-sm font-mono text-gray-600">{tenant.slug}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">ステータス</span>
                <p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tenant.isActive ? '有効' : '無効'}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">ID</span>
                <p className="text-sm text-gray-600">{tenant.id}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">作成日</span>
                <p className="text-sm text-gray-600">{formatDateTime(tenant.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">最終更新日</span>
                <p className="text-sm text-gray-600">{formatDateTime(tenant.updatedAt)}</p>
              </div>
            </div>
          </section>

          {/* 統計情報 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              統計情報
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ユーザー数', value: tenant._count.users, color: 'blue' },
                { label: '部署数', value: tenant._count.departments, color: 'purple' },
                { label: 'グループ数', value: tenant._count.groups, color: 'indigo' },
                { label: '売上レコード', value: tenant._count.salesRecords, color: 'green' },
                { label: '目標設定', value: tenant._count.targets, color: 'amber' },
                { label: '外部連携', value: tenant._count.integrations, color: 'pink' },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 管理者一覧 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              管理者一覧
              <span className="text-xs text-gray-400 font-normal">({tenant.users.length}名)</span>
            </h3>
            {tenant.users.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">管理者が登録されていません</p>
            ) : (
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {tenant.users.map((user) => (
                  <div key={user.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name || '(名前未設定)'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
