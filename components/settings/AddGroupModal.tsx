'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';

interface MemberOption {
  id: string;
  name: string;
}

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddGroupModal({
  isOpen,
  onClose,
  onAdded,
}: AddGroupModalProps) {
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setManagerId('');
      fetch('/api/members?type=sales')
        .then((res) => res.json())
        .then((data) => setMemberOptions(data))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          managerId: managerId ? Number(managerId) : undefined,
        }),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('グループを追加しました。');
        onAdded();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '追加に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
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
        disabled={submitting || !name}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="グループを追加"
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            グループ名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="第1営業チーム"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            マネージャー
          </label>
          <Select
            value={managerId}
            onChange={setManagerId}
            options={[
              { value: '', label: '未設定' },
              ...memberOptions.map((m) => ({
                value: String(m.id),
                label: m.name,
              })),
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
