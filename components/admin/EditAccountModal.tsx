'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';

interface Account {
  id: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
}

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  account: Account | null;
}

export default function EditAccountModal({
  isOpen,
  onClose,
  onUpdated,
  account,
}: EditAccountModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && account) {
      setName(account.name || '');
      setEmail(account.email);
      setPassword('');
    }
  }, [isOpen, account]);

  const handleSubmit = async () => {
    if (!account) return;
    setSubmitting(true);
    try {
      const updateData: Record<string, string> = {};
      if (name !== (account.name || '')) updateData.name = name;
      if (email !== account.email) updateData.email = email;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        await Dialog.error('変更内容がありません');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('アカウントを更新しました');
        onUpdated();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '更新に失敗しました');
      }
    } catch {
      await Dialog.error('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button
        label="キャンセル"
        variant="outline"
        color="gray"
        onClick={onClose}
      />
      <Button
        label={submitting ? '更新中...' : '更新'}
        onClick={handleSubmit}
        disabled={submitting}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="アカウント編集"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード
            <span className="text-xs text-gray-400 font-normal ml-2">
              変更する場合のみ入力
            </span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="8文字以上"
            minLength={8}
          />
        </div>
      </div>
    </Modal>
  );
}
