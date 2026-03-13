'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';
import CreateAccountModal from '@/components/admin/CreateAccountModal';
import EditAccountModal from '@/components/admin/EditAccountModal';

interface Account {
  id: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
}

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounts');
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (account: Account) => {
    const confirmed = await Dialog.confirm(
      `アカウント「${account.email}」を削除しますか？\nこの操作は取り消せません。`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await Dialog.success('アカウントを削除しました');
        fetchAccounts();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '削除に失敗しました');
      }
    } catch {
      await Dialog.error('ネットワークエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">アカウント管理</h2>
        <Button label="アカウント追加" onClick={() => setIsCreateOpen(true)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                名前
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                メールアドレス
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                ステータス
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                作成日
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-gray-400 text-sm"
                >
                  アカウントがありません
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {account.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {account.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {account.status === 'ACTIVE' ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(account.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        label="編集"
                        variant="outline"
                        color="blue"
                        onClick={() => setEditAccount(account)}
                        className="px-3 py-1.5 text-xs"
                      />
                      <Button
                        label="削除"
                        variant="outline"
                        color="red"
                        onClick={() => handleDelete(account)}
                        className="px-3 py-1.5 text-xs"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchAccounts}
      />

      <EditAccountModal
        isOpen={editAccount !== null}
        onClose={() => setEditAccount(null)}
        onUpdated={fetchAccounts}
        account={editAccount}
      />
    </main>
  );
}
