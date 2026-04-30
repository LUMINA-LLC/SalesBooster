'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
  member: { id: string; name: string } | null;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onChanged,
  member,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const isTooShort = password.length > 0 && password.length < 8;
  const isMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    !!member &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async () => {
    if (!member || !canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/members/${member.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('パスワードを変更しました。');
        onChanged?.();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || 'パスワードの変更に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      await Dialog.error(
        'パスワードの変更に失敗しました。ネットワーク接続を確認してください。',
      );
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
        disabled={submitting || !canSubmit}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="パスワードを変更"
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        {member && (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">{member.name}</span>{' '}
            のパスワードを変更します。
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isTooShort && (
            <p className="text-xs text-red-500 mt-1">
              パスワードは8文字以上で入力してください。
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード（確認） <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isMismatch && (
            <p className="text-xs text-red-500 mt-1">
              パスワードが一致しません。
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
