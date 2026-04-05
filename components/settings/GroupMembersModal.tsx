'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface MemberOption {
  id: string;
  name: string;
  department: string | null;
}

interface MembershipRecord {
  id: number;
  userId: string;
  startMonth: string;
  endMonth: string | null;
  user: { id: string; name: string };
}

interface GroupData {
  id: number;
  name: string;
  memberList: { id: string; name: string }[];
}

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  group: GroupData | null;
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function GroupMembersModal({
  isOpen,
  onClose,
  onUpdated,
  group,
}: GroupMembersModalProps) {
  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 一括追加フォーム
  const [selectedAddIds, setSelectedAddIds] = useState<Set<string>>(new Set());
  const [addStartMonth, setAddStartMonth] = useState(getCurrentMonth());
  const [addSearch, setAddSearch] = useState('');

  // 終了月設定フォーム
  const [endingId, setEndingId] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState(getCurrentMonth());

  const fetchData = async () => {
    if (!group) return;
    setLoading(true);
    try {
      const [membersRes, historyRes] = await Promise.all([
        fetch('/api/members?type=sales'),
        fetch(`/api/groups/${group.id}/members`),
      ]);
      const membersData = await membersRes.json();
      const historyData = await historyRes.json();
      setAllMembers(membersData);
      setMemberships(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && group) {
      setSelectedAddIds(new Set());
      setAddStartMonth(getCurrentMonth());
      setAddSearch('');
      setEndingId(null);
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, group]);

  // 現在所属中のメンバー
  const currentMemberships = useMemo(
    () => memberships.filter((m) => m.endMonth === null),
    [memberships],
  );

  // 過去の所属（終了済み）
  const pastMemberships = useMemo(
    () => memberships.filter((m) => m.endMonth !== null),
    [memberships],
  );

  // まだグループに所属していないメンバー（追加候補）
  const currentMemberIds = useMemo(
    () => new Set(currentMemberships.map((m) => m.userId)),
    [currentMemberships],
  );

  const availableMembers = useMemo(() => {
    const q = addSearch.toLowerCase();
    return allMembers.filter(
      (m) =>
        !currentMemberIds.has(m.id) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          (m.department && m.department.toLowerCase().includes(q))),
    );
  }, [allMembers, currentMemberIds, addSearch]);

  const handleToggleAdd = (id: string) => {
    setSelectedAddIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllAdd = () => {
    setSelectedAddIds(new Set(availableMembers.map((m) => m.id)));
  };

  const handleDeselectAllAdd = () => {
    setSelectedAddIds(new Set());
  };

  const handleBulkAdd = async () => {
    if (!group || selectedAddIds.size === 0 || !addStartMonth) return;
    setSubmitting(true);
    try {
      const startMonthISO = `${addStartMonth}-01T00:00:00.000Z`;
      // 一括追加: syncMembers APIを使用（既存メンバーは保持、新規のみ追加）
      const currentIds = currentMemberships.map((m) => m.userId);
      const allIds = [...currentIds, ...Array.from(selectedAddIds)];
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: allIds, startMonth: startMonthISO }),
      });
      if (res.ok) {
        setSelectedAddIds(new Set());
        await fetchData();
        onUpdated();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || 'メンバーの追加に失敗しました。');
      }
    } catch {
      await Dialog.error('メンバーの追加に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndMembership = async (membershipId: number) => {
    if (!group || !endMonth) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId,
          endMonth: `${endMonth}-01T00:00:00.000Z`,
        }),
      });
      if (res.ok) {
        setEndingId(null);
        await fetchData();
        onUpdated();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '終了月の設定に失敗しました。');
      }
    } catch {
      await Dialog.error('終了月の設定に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMembership = async (membershipId: number) => {
    if (!group) return;
    const confirmed = await Dialog.confirm('この所属レコードを削除しますか？');
    if (!confirmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      if (res.ok) {
        await fetchData();
        onUpdated();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '削除に失敗しました。');
      }
    } catch {
      await Dialog.error('削除に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const allAvailableSelected =
    availableMembers.length > 0 &&
    availableMembers.every((m) => selectedAddIds.has(m.id));

  const footer = (
    <>
      <span className="text-sm text-gray-500 mr-auto">
        現在 {currentMemberships.length}名 所属中
      </span>
      <Button label="閉じる" variant="outline" color="gray" onClick={onClose} />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${group?.name || ''} - メンバー管理`}
      footer={footer}
      maxWidth="lg"
    >
      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-5">
          {/* メンバー一括追加セクション */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              メンバーを追加
            </h4>
            <div className="flex items-end gap-2 mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="名前・部署で検索..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  開始月
                </label>
                <input
                  type="month"
                  value={addStartMonth}
                  onChange={(e) => setAddStartMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                label={
                  submitting ? '追加中...' : `${selectedAddIds.size}名を追加`
                }
                onClick={handleBulkAdd}
                disabled={submitting || selectedAddIds.size === 0}
              />
            </div>

            {availableMembers.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4 border border-gray-200 rounded-lg">
                追加可能なメンバーがいません
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {availableMembers.length}名 表示中 / {selectedAddIds.size}名
                    選択中
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={handleSelectAllAdd}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      すべて選択
                    </button>
                    <button
                      onClick={handleDeselectAllAdd}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      すべて解除
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  <label className="flex items-center px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={allAvailableSelected}
                      onChange={
                        allAvailableSelected
                          ? handleDeselectAllAdd
                          : handleSelectAllAdd
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-600">
                      全選択
                    </span>
                  </label>
                  {availableMembers.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddIds.has(m.id)}
                        onChange={() => handleToggleAdd(m.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-800">
                        {m.name}
                      </span>
                      {m.department && (
                        <span className="ml-2 text-xs text-gray-400">
                          {m.department}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 現在所属中メンバー */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              現在所属中
            </h4>
            {currentMemberships.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4 border border-gray-200 rounded-lg">
                所属メンバーがいません
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
                {currentMemberships.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div>
                      <span className="text-sm text-gray-800 font-medium">
                        {m.user.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {formatMonth(m.startMonth)} 〜
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {endingId === m.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="month"
                            value={endMonth}
                            onChange={(e) => setEndMonth(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleEndMembership(m.id)}
                            disabled={submitting}
                            className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => setEndingId(null)}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEndingId(m.id);
                              setEndMonth(getCurrentMonth());
                            }}
                            className="text-xs px-2 py-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                          >
                            異動
                          </button>
                          <button
                            onClick={() => handleRemoveMembership(m.id)}
                            className="text-xs px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            削除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 過去の所属履歴 */}
          {pastMemberships.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                過去の所属履歴
              </h4>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {pastMemberships.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50"
                  >
                    <div>
                      <span className="text-sm text-gray-600">
                        {m.user.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {formatMonth(m.startMonth)} 〜{' '}
                        {m.endMonth ? formatMonth(m.endMonth) : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveMembership(m.id)}
                      className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
