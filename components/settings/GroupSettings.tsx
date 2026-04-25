'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/common/Dialog';
import Button from '@/components/common/Button';
import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupMembersPanel from './GroupMembersPanel';

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
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

  const fetchGroups = async () => {
    try {
      setFetchError(null);
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data: Group[] = await res.json();
        setGroups(data);
        // アクティブタブの維持。無ければ先頭グループを選択。
        setActiveGroupId((prev) => {
          if (prev !== null && data.some((g) => g.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      } else {
        setFetchError('グループ情報の取得に失敗しました。');
      }
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

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">グループ設定</h2>
        <Button
          label="グループを追加"
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-500 mb-4">
            グループが未登録です。追加してください。
          </div>
          <Button
            label="グループを追加"
            onClick={() => setIsAddModalOpen(true)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* タブ */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 pt-3">
            {groups.map((group) => {
              const isActive = activeGroupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px rounded-t-md transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-700 bg-blue-50/60'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`relative w-6 h-6 rounded-md overflow-hidden shrink-0 transition-shadow ${
                      isActive
                        ? 'ring-2 ring-blue-300 ring-offset-1 ring-offset-blue-50'
                        : 'ring-1 ring-gray-200'
                    }`}
                  >
                    {group.imageUrl ? (
                      <Image
                        src={group.imageUrl}
                        alt={group.name}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                        <span className="text-white text-[11px] font-bold">
                          {group.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span>{group.name}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-semibold rounded-full border ${
                      isActive
                        ? 'bg-white border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {group.members}
                  </span>
                </button>
              );
            })}
          </div>

          {/* タブコンテンツ */}
          {activeGroup && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
                    {activeGroup.imageUrl ? (
                      <Image
                        src={activeGroup.imageUrl}
                        alt={activeGroup.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                        <span className="text-white text-sm font-bold">
                          {activeGroup.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {activeGroup.name}
                    </h3>
                    <div className="text-xs text-gray-500">
                      所属メンバー {activeGroup.members}名
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    label="編集"
                    variant="outline"
                    color="gray"
                    onClick={() => setEditingGroup(activeGroup)}
                  />
                  <Button
                    label="削除"
                    variant="outline"
                    color="red"
                    onClick={() => handleDelete(activeGroup.id)}
                  />
                </div>
              </div>

              <GroupMembersPanel
                key={activeGroup.id}
                group={activeGroup}
                onUpdated={fetchGroups}
              />
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}
