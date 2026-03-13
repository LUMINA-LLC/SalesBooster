'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';

interface MemberOption {
  id: string;
  name: string;
}

interface GroupData {
  id: number;
  name: string;
  imageUrl?: string | null;
  managerId: number | null;
  members: number;
  memberList: { id: string; name: string }[];
}

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  group: GroupData | null;
}

export default function EditGroupModal({
  isOpen,
  onClose,
  onUpdated,
  group,
}: EditGroupModalProps) {
  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && group) {
      setName(group.name);
      setManagerId(group.managerId ? String(group.managerId) : '');
      setImageUrl(group.imageUrl || null);
      fetch('/api/members')
        .then((res) => res.json())
        .then((data) => setAllMembers(data))
        .catch(console.error);
    }
  }, [isOpen, group]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      } else {
        const data = await res.json();
        await Dialog.error(
          data.error || 'アイコンのアップロードに失敗しました',
        );
      }
    } catch {
      await Dialog.error('アイコンのアップロードに失敗しました');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!group || !name) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          managerId: managerId ? Number(managerId) : null,
          imageUrl,
        }),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('グループ情報を更新しました。');
        onUpdated();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '更新に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to update group:', error);
      await Dialog.error('更新に失敗しました。');
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
        disabled={submitting || !name}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="グループを編集"
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            アイコン
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-sm bg-gray-300 overflow-hidden border border-gray-200 shadow-sm shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name || 'グループ'}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                  <span className="text-white text-xl font-bold">
                    {(name || '?').charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors inline-block text-center">
                {uploading ? 'アップロード中...' : '画像を選択'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {imageUrl && (
                <button
                  onClick={() => setImageUrl(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            グループ名 <span className="text-red-500">*</span>
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
            マネージャー
          </label>
          <Select
            value={managerId}
            onChange={setManagerId}
            options={[
              { value: '', label: '未設定' },
              ...allMembers.map((m) => ({
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
