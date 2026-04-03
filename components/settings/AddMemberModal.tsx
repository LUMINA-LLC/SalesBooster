'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';

interface Department {
  id: number;
  name: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  isOperator?: boolean;
  defaultRole?: string;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onAdded,
  isOperator = false,
  defaultRole = 'USER',
}: AddMemberModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setRole(defaultRole);
      setDepartmentId('');
      fetch('/api/departments')
        .then((res) => res.json())
        .then((data) => setDepartments(data))
        .catch(console.error);
    }
  }, [isOpen, defaultRole]);

  const handleSubmit = async () => {
    if (!name || !email || !password) return;
    if (password.length < 8) {
      await Dialog.error('パスワードは8文字以上で入力してください。');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: isOperator ? 'USER' : role,
          isOperator,
          departmentId: departmentId ? Number(departmentId) : undefined,
        }),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('メンバーを追加しました。');
        onAdded();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '追加に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to create member:', error);
      await Dialog.error('追加に失敗しました。');
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
        label={submitting ? '追加中...' : '追加'}
        onClick={handleSubmit}
        disabled={submitting || !name || !email || !password}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isOperator
          ? '入力担当者を追加'
          : defaultRole === 'ADMIN'
            ? '管理者を追加'
            : 'メンバーを追加'
      }
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="山田 太郎"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="taro.yamada@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="8文字以上"
          />
          <p className="mt-1 text-xs text-gray-400">
            初期パスワードを設定してください（8文字以上）
          </p>
        </div>
        {!isOperator && defaultRole !== 'ADMIN' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役割
            </label>
            <Select
              value={role}
              onChange={setRole}
              options={[
                { value: 'USER', label: 'ユーザー' },
                { value: 'ADMIN', label: '管理者' },
              ]}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            部署
          </label>
          <Select
            value={departmentId}
            onChange={setDepartmentId}
            options={[
              { value: '', label: '未所属' },
              ...departments.map((d) => ({
                value: String(d.id),
                label: d.name,
              })),
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
