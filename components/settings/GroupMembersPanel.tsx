'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog } from '@/components/common/Dialog';
import AddMembersSection from './groupMembers/AddMembersSection';
import MembershipList from './groupMembers/MembershipList';
import type { MemberOption, MembershipRecord } from './groupMembers/utils';

interface GroupData {
  id: number;
  name: string;
  memberList: { id: string; name: string }[];
}

interface GroupMembersPanelProps {
  group: GroupData;
  onUpdated: () => void;
}

export default function GroupMembersPanel({
  group,
  onUpdated,
}: GroupMembersPanelProps) {
  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
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
  }, [group.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentMemberships = useMemo(
    () => memberships.filter((m) => m.endMonth === null),
    [memberships],
  );

  const pastMemberships = useMemo(
    () => memberships.filter((m) => m.endMonth !== null),
    [memberships],
  );

  const currentMemberIds = useMemo(
    () => new Set(currentMemberships.map((m) => m.userId)),
    [currentMemberships],
  );

  const handleBulkAdd = async ({
    userIds,
    startMonth,
    endMonth,
  }: {
    userIds: string[];
    startMonth: string;
    endMonth: string | null;
  }) => {
    setSubmitting(true);
    try {
      const startMonthISO = `${startMonth}-01T00:00:00.000Z`;

      if (endMonth) {
        // 終了月指定あり = 過去の所属期間として個別追加
        const endMonthISO = `${endMonth}-01T00:00:00.000Z`;
        for (const userId of userIds) {
          const res = await fetch(`/api/groups/${group.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              startMonth: startMonthISO,
              endMonth: endMonthISO,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.error || 'メンバーの追加に失敗しました。');
          }
        }
      } else {
        // 終了月なし = 現在所属中として一括追加
        const currentIds = currentMemberships.map((m) => m.userId);
        const allIds = [...currentIds, ...userIds];
        const res = await fetch(`/api/groups/${group.id}/members`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberIds: allIds,
            startMonth: startMonthISO,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || 'メンバーの追加に失敗しました。');
        }
      }

      await fetchData();
      onUpdated();
    } catch (err) {
      await Dialog.error(
        err instanceof Error ? err.message : 'メンバーの追加に失敗しました。',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePeriod = async (
    membershipId: number,
    startMonth: string,
    endMonth: string | null,
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/members/period`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId,
          startMonth: `${startMonth}-01T00:00:00.000Z`,
          endMonth: endMonth ? `${endMonth}-01T00:00:00.000Z` : null,
        }),
      });
      if (res.ok) {
        await fetchData();
        onUpdated();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '期間の更新に失敗しました。');
      }
    } catch {
      await Dialog.error('期間の更新に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndMembership = async (
    membershipId: number,
    endMonth: string,
  ) => {
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

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-5">
      <AddMembersSection
        allMembers={allMembers}
        excludeIds={currentMemberIds}
        submitting={submitting}
        onAdd={handleBulkAdd}
        resetKey={group.id}
      />

      <MembershipList
        title="現在所属中"
        members={currentMemberships}
        variant="current"
        submitting={submitting}
        emptyText="所属メンバーがいません"
        onUpdatePeriod={handleUpdatePeriod}
        onEndMembership={handleEndMembership}
        onRemove={handleRemoveMembership}
      />

      {pastMemberships.length > 0 && (
        <MembershipList
          title="過去の所属履歴"
          members={pastMemberships}
          variant="past"
          submitting={submitting}
          onUpdatePeriod={handleUpdatePeriod}
          onRemove={handleRemoveMembership}
        />
      )}
    </div>
  );
}
