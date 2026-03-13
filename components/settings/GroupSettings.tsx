'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/common/Dialog';
import Button from '@/components/common/Button';
import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupMembersModal from './GroupMembersModal';

interface Group {
  id: number;
  name: string;
  imageUrl?: string | null;
  members: number;
  managerId: number | null;
  memberList: { id: string; name: string }[];
}

export default function GroupSettings() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [membersGroup, setMembersGroup] = useState<Group | null>(null);

  const fetchGroups = async () => {
    try {
      setFetchError(null);
      const res = await fetch('/api/groups');
      if (res.ok) setGroups(await res.json());
      else setFetchError('グループ情報の取得に失敗しました。');
    } catch {
      setFetchError(
        'グループ情報の取得に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = await Dialog.confirm('このグループを削除しますか？');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGroups();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || 'グループの削除に失敗しました。');
      }
    } catch {
      await Dialog.error(
        'グループの削除に失敗しました。ネットワーク接続を確認してください。',
      );
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-3">{fetchError}</div>
        <button
          onClick={fetchGroups}
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
        <h2 className="text-xl font-bold text-gray-800">グループ設定</h2>
        <Button
          label="グループを追加"
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-10 h-10 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
                {group.imageUrl ? (
                  <Image
                    src={group.imageUrl}
                    alt={group.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                    <span className="text-white text-sm font-bold">
                      {group.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-800">{group.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>メンバー数</span>
                <span className="font-medium text-gray-800">
                  {group.members}名
                </span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                label="メンバー"
                variant="outline"
                color="blue"
                onClick={() => setMembersGroup(group)}
                className="flex-1 justify-center"
              />
              <Button
                label="編集"
                variant="outline"
                color="gray"
                onClick={() => setEditingGroup(group)}
                className="flex-1 justify-center"
              />
              <Button
                label="削除"
                variant="outline"
                color="red"
                onClick={() => handleDelete(group.id)}
                className="flex-1 justify-center"
              />
            </div>
          </div>
        ))}
      </div>

      <AddGroupModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={fetchGroups}
      />

      <EditGroupModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        onUpdated={fetchGroups}
        group={editingGroup}
      />

      <GroupMembersModal
        isOpen={!!membersGroup}
        onClose={() => setMembersGroup(null)}
        onUpdated={fetchGroups}
        group={membersGroup}
      />
    </div>
  );
}
