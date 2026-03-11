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

interface MemberData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  departmentId?: number | null;
  imageUrl?: string | null;
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  member: MemberData | null;
}

export default function EditMemberModal({ isOpen, onClose, onUpdated, member }: EditMemberModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [status, setStatus] = useState('ACTIVE');
  const [departmentId, setDepartmentId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && member) {
      setName(member.name);
      setEmail(member.email);
      setRole(member.role);
      setStatus(member.status);
      setDepartmentId(member.departmentId ? String(member.departmentId) : '');
      setImageUrl(member.imageUrl || null);
      fetch('/api/departments')
        .then((res) => res.json())
        .then((data) => setDepartments(data))
        .catch(console.error);
    }
  }, [isOpen, member]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.data.url);
      } else {
        const data = await res.json();
        await Dialog.error(data.error || 'アイコンのアップロードに失敗しました');
      }
    } catch {
      await Dialog.error('アイコンのアップロードに失敗しました');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!member || !name || !email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          status,
          departmentId: departmentId ? Number(departmentId) : null,
          imageUrl,
        }),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('メンバー情報を更新しました。');
        onUpdated();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '更新に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to update member:', error);
      await Dialog.error('更新に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button label="キャンセル" variant="outline" color="gray" onClick={onClose} />
      <Button label={submitting ? '更新中...' : '更新'} onClick={handleSubmit} disabled={submitting || !name || !email} />
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="メンバーを編集" footer={footer} maxWidth="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">アイコン</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="アイコン" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                  <span className="text-white text-xl font-bold">{name ? name.charAt(0) : '?'}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {uploading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    アップロード中...
                  </>
                ) : '画像を選択'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} disabled={uploading} className="hidden" />
              </label>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl(null)} className="text-xs text-red-500 hover:text-red-700 text-left">
                  削除
                </button>
              )}
              <span className="text-xs text-gray-400">JPG, PNG, WebP / 2MB以下</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
          <Select
            value={role}
            onChange={setRole}
            options={[
              { value: 'USER', label: 'ユーザー' },
              { value: 'ADMIN', label: '管理者' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'ACTIVE', label: '有効' },
              { value: 'INACTIVE', label: '無効' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
          <Select
            value={departmentId}
            onChange={setDepartmentId}
            options={[
              { value: '', label: '未所属' },
              ...departments.map((d) => ({ value: String(d.id), label: d.name })),
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
