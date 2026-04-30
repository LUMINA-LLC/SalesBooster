'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Dialog } from '@/components/common/Dialog';
import DataTable, { Column } from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import DropdownMenu from '@/components/common/DropdownMenu';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import ImportMembersModal from './ImportMembersModal';
import ChangePasswordModal from './ChangePasswordModal';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isOperator?: boolean;
  department: string | null;
  departmentId?: number | null;
  imageUrl?: string | null;
}

type MemberTab = 'members' | 'admins' | 'operators';

const roleLabel: Record<string, string> = { ADMIN: '管理者', USER: 'ユーザー' };
const statusLabel: Record<string, string> = {
  ACTIVE: '有効',
  INACTIVE: '無効',
};

export default function MemberSettings() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;

  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<MemberTab>('members');

  /**
   * パスワード変更可否:
   *  - SUPER_ADMIN: 全員可
   *  - ADMIN: USER（=isOperator含む）または自分自身のみ可
   *  - その他: 不可
   */
  const canChangePasswordOf = (m: Member): boolean => {
    if (currentUserRole === 'SUPER_ADMIN') return true;
    if (currentUserRole === 'ADMIN') {
      if (m.id === currentUserId) return true;
      return m.role === 'USER';
    }
    return false;
  };

  const fetchMembers = async () => {
    try {
      setFetchError(null);
      const res = await fetch('/api/members');
      if (res.ok) setAllMembers(await res.json());
      else setFetchError('メンバー情報の取得に失敗しました。');
    } catch {
      setFetchError(
        'メンバー情報の取得に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const members = useMemo(
    () => allMembers.filter((m) => m.role === 'USER' && !m.isOperator),
    [allMembers],
  );
  const admins = useMemo(
    () => allMembers.filter((m) => m.role === 'ADMIN'),
    [allMembers],
  );
  const operators = useMemo(
    () => allMembers.filter((m) => m.isOperator),
    [allMembers],
  );
  const displayedMembers =
    activeTab === 'members'
      ? members
      : activeTab === 'admins'
        ? admins
        : operators;

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
      await Dialog.error(
        'メンバーの削除に失敗しました。ネットワーク接続を確認してください。',
      );
    }
  };

  const columns: Column<Member>[] = [
    {
      key: 'name',
      label: '名前',
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
            {m.imageUrl ? (
              <Image
                src={m.imageUrl}
                alt={m.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                <span className="text-white text-sm font-bold">
                  {m.name.charAt(0)}
                </span>
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
      render: (m) => (
        <span className="text-sm text-gray-600">
          {roleLabel[m.role] || m.role}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'ステータス',
      render: (m) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            m.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
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
          <Button
            label="編集"
            variant="outline"
            color="blue"
            onClick={() => setEditingMember(m)}
            className="px-3 py-1.5 text-xs"
          />
          {canChangePasswordOf(m) && (
            <Button
              label="パスワード変更"
              variant="outline"
              color="gray"
              onClick={() => setPasswordTarget(m)}
              className="px-3 py-1.5 text-xs"
            />
          )}
          <Button
            label="削除"
            variant="outline"
            color="red"
            onClick={() => handleDelete(m.id)}
            className="px-3 py-1.5 text-xs"
          />
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
        <button
          onClick={fetchMembers}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">メンバー設定</h2>
        <DropdownMenu
          items={[
            {
              label:
                activeTab === 'members'
                  ? 'メンバーを追加'
                  : activeTab === 'admins'
                    ? '管理者を追加'
                    : '入力担当者を追加',
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              ),
              onClick: () => setIsAddModalOpen(true),
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
          ]}
        />
      </div>

      {/* タブ */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 pt-3 mb-4">
        {(
          [
            { key: 'members', label: 'メンバー', count: members.length },
            { key: 'admins', label: '管理者', count: admins.length },
            { key: 'operators', label: '入力担当者', count: operators.length },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px rounded-t-md transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-700 bg-blue-50/60'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-semibold rounded-full border ${
                  isActive
                    ? 'bg-white border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'admins' && (
        <p className="text-xs text-gray-500 mb-3">
          管理者はライセンス人数にカウントされません。ランキングにも表示されず、データ入力の対象にもなりません。
        </p>
      )}
      {activeTab === 'operators' && (
        <p className="text-xs text-gray-500 mb-3">
          入力担当者はライセンス人数にカウントされません。ランキングにも表示されず、データ入力の対象にもなりません。
        </p>
      )}

      <DataTable
        data={displayedMembers}
        columns={columns}
        keyField="id"
        searchPlaceholder="名前・メール・部署で検索..."
        searchFilter={(m, q) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.department != null && m.department.toLowerCase().includes(q))
        }
        emptyMessage={
          activeTab === 'members'
            ? '該当するメンバーがいません'
            : '入力担当者がいません'
        }
        mobileRender={(m) => (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
                  {m.imageUrl ? (
                    <Image
                      src={m.imageUrl}
                      alt={m.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                      <span className="text-white text-sm font-bold">
                        {m.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {m.name}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  m.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {statusLabel[m.status] || m.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {roleLabel[m.role] || m.role}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                label="編集"
                variant="outline"
                color="blue"
                onClick={() => setEditingMember(m)}
                className="px-3 py-1.5 text-xs"
              />
              {canChangePasswordOf(m) && (
                <Button
                  label="パスワード変更"
                  variant="outline"
                  color="gray"
                  onClick={() => setPasswordTarget(m)}
                  className="px-3 py-1.5 text-xs"
                />
              )}
              <Button
                label="削除"
                variant="outline"
                color="red"
                onClick={() => handleDelete(m.id)}
                className="px-3 py-1.5 text-xs"
              />
            </div>
          </div>
        )}
      />

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={fetchMembers}
        isOperator={activeTab === 'operators'}
        defaultRole={activeTab === 'admins' ? 'ADMIN' : 'USER'}
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

      <ChangePasswordModal
        isOpen={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        member={passwordTarget}
      />
    </div>
  );
}
