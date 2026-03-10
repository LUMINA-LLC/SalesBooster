'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAccountModal({ isOpen, onClose, onCreated }: CreateAccountModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      if (res.ok) {
        handleClose();
        await Dialog.success('アカウントを作成しました');
        onCreated();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '作成に失敗しました');
      }
    } catch {
      await Dialog.error('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button label="キャンセル" variant="outline" color="gray" onClick={handleClose} />
      <Button label={submitting ? '作成中...' : '作成'} onClick={handleSubmit} disabled={submitting || !email || !password} />
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="アカウント追加" footer={footer}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="管理者名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="8文字以上"
            minLength={8}
            required
          />
        </div>
      </div>
    </Modal>
  );
}
