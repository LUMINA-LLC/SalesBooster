'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/common/Dialog';
import DataTable, { Column } from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import DropdownMenu from '@/components/common/DropdownMenu';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import ImportMembersModal from './ImportMembersModal';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  departmentId?: number | null;
  imageUrl?: string | null;
}

const roleLabel: Record<string, string> = { ADMIN: '管理者', USER: 'ユーザー' };
const statusLabel: Record<string, string> = { ACTIVE: '有効', INACTIVE: '無効' };

export default function MemberSettings() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const fetchMembers = async () => {
    try {
      setFetchError(null);
      const res = await fetch('/api/members');
      if (res.ok) setMembers(await res.json());
      else setFetchError('メンバー情報の取得に失敗しました。');
    } catch {
      setFetchError('メンバー情報の取得に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await Dialog.confirm('このメンバーを削除しますか？');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || 'メンバーの削除に失敗しました。');
      }
    } catch {
      await Dialog.error('メンバーの削除に失敗しました。ネットワーク接続を確認してください。');
    }
  };

  const columns: Column<Member>[] = [
    {
      key: 'name',
      label: '名前',
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
            {m.imageUrl ? (
              <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                <span className="text-white text-sm font-bold">{m.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-800">{m.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'メール',
      render: (m) => <span className="text-sm text-gray-600">{m.email}</span>,
    },
    {
      key: 'role',
      label: '役割',
      render: (m) => <span className="text-sm text-gray-600">{roleLabel[m.role] || m.role}</span>,
    },
    {
      key: 'status',
      label: 'ステータス',
      render: (m) => (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {statusLabel[m.status] || m.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end space-x-2">
          <Button label="編集" variant="outline" color="blue" onClick={() => setEditingMember(m)} className="px-3 py-1.5 text-xs" />
          <Button label="削除" variant="outline" color="red" onClick={() => handleDelete(m.id)} className="px-3 py-1.5 text-xs" />
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-3">{fetchError}</div>
        <button onClick={fetchMembers} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">再読み込み</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">メンバー設定</h2>
        <DropdownMenu items={[
          {
            label: 'メンバーを追加',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            ),
            onClick: () => setIsAddModalOpen(true),
          },
          {
            label: 'インポート',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            ),
            onClick: () => setIsImportModalOpen(true),
          },
        ]} />
      </div>

      <DataTable
        data={members}
        columns={columns}
        keyField="id"
        searchPlaceholder="名前・メール・部署で検索..."
        searchFilter={(m, q) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.department != null && m.department.toLowerCase().includes(q))
        }
        emptyMessage="該当するメンバーがいません"
        mobileRender={(m) => (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
                  {m.imageUrl ? (
                    <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                      <span className="text-white text-sm font-bold">{m.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800">{m.name}</span>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {statusLabel[m.status] || m.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-3">{roleLabel[m.role] || m.role}</div>
            <div className="flex items-center space-x-2">
              <Button label="編集" variant="outline" color="blue" onClick={() => setEditingMember(m)} className="px-3 py-1.5 text-xs" />
              <Button label="削除" variant="outline" color="red" onClick={() => handleDelete(m.id)} className="px-3 py-1.5 text-xs" />
            </div>
          </div>
        )}
      />

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={fetchMembers}
      />

      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onUpdated={fetchMembers}
        member={editingMember}
      />

      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={fetchMembers}
      />
    </div>
  );
}
