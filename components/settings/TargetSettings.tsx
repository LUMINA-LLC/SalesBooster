'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Select from '@/components/common/Select';
import type { DataTypeInfo } from '@/types';
import { Dialog } from '@/components/common/Dialog';
import { getUnitLabel } from '@/lib/units';
import IndividualTargetTable from './target/IndividualTargetTable';
import GroupTargetTable from './target/GroupTargetTable';

interface MemberInfo {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface GroupInfo {
  id: number;
  name: string;
  imageUrl?: string | null;
  memberCount: number;
  memberList: string[];
}

type TabType = 'individual' | 'group';

export default function TargetSettings() {
  const [tab, setTab] = useState<TabType>('individual');
  const [year, setYear] = useState(new Date().getFullYear());
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [selectedDataTypeId, setSelectedDataTypeId] = useState('');
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [individualTargets, setIndividualTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [groupTargets, setGroupTargets] = useState<
    Record<number, Record<number, number>>
  >({});

  const [hasChanges, setHasChanges] = useState(false);
  const initialDataRef = useRef<string>('');

  useEffect(() => {
    fetch('/api/data-types?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DataTypeInfo[]) => {
        setDataTypes(data);
        const defaultType = data.find((dt: DataTypeInfo) => dt.isDefault);
        if (defaultType) setSelectedDataTypeId(String(defaultType.id));
        else if (data.length > 0) setSelectedDataTypeId(String(data[0].id));
      })
      .catch(() => setDataTypes([]));

    fetch('/api/members?type=sales')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MemberInfo[]) => setMembers(data))
      .catch(() => setMembers([]));

    fetch('/api/groups')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: GroupInfo[]) => setGroups(data))
      .catch(() => setGroups([]));
  }, []);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year) });
      if (selectedDataTypeId) params.set('dataTypeId', selectedDataTypeId);

      const [indRes, grpRes] = await Promise.all([
        fetch(`/api/targets/by-year?${params}`),
        fetch(`/api/targets/groups?${params}`),
      ]);

      if (indRes.ok) {
        const data = await indRes.json();
        const targets: Record<string, Record<number, number>> = {};
        for (const [userId, info] of Object.entries(
          data as Record<string, { months: Record<number, number> }>,
        )) {
          targets[userId] = { ...info.months };
        }
        setIndividualTargets(targets);
        initialDataRef.current = JSON.stringify(targets);
      }

      if (grpRes.ok) {
        const data = await grpRes.json();
        const targets: Record<number, Record<number, number>> = {};
        for (const [groupId, info] of Object.entries(
          data as Record<string, { months: Record<number, number> }>,
        )) {
          targets[Number(groupId)] = { ...info.months };
        }
        setGroupTargets(targets);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  }, [year, selectedDataTypeId]);

  useEffect(() => {
    if (selectedDataTypeId) fetchTargets();
  }, [fetchTargets, selectedDataTypeId]);

  const handleIndividualChange = (
    userId: string,
    month: number,
    value: string,
  ) => {
    const numValue = value === '' ? 0 : Number(value);
    if (isNaN(numValue)) return;
    setIndividualTargets((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [month]: numValue },
    }));
    setHasChanges(true);
  };

  const handleGroupChange = (groupId: number, month: number, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    if (isNaN(numValue)) return;
    setGroupTargets((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], [month]: numValue },
    }));
    setHasChanges(true);
  };

  const calcGroupMemberTotal = (group: GroupInfo, month: number): number => {
    return group.memberList.reduce((sum, userId) => {
      return sum + (individualTargets[userId]?.[month] || 0);
    }, 0);
  };

  const saveIndividualTargets = async () => {
    setSaving(true);
    try {
      const targets: { userId: string; month: number; value: number }[] = [];
      for (const [userId, months] of Object.entries(individualTargets)) {
        for (const [month, value] of Object.entries(months)) {
          if (value > 0) {
            targets.push({ userId, month: Number(month), value });
          }
        }
      }

      const res = await fetch('/api/targets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets,
          year,
          ...(selectedDataTypeId
            ? { dataTypeId: Number(selectedDataTypeId) }
            : {}),
        }),
      });

      if (res.ok) {
        Dialog.success('保存しました');
        initialDataRef.current = JSON.stringify(individualTargets);
        setHasChanges(false);
      } else {
        Dialog.error('保存に失敗しました');
      }
    } catch {
      Dialog.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const saveGroupTargets = async () => {
    setSaving(true);
    try {
      const targets: { groupId: number; month: number; value: number }[] = [];
      for (const [groupId, months] of Object.entries(groupTargets)) {
        for (const [month, value] of Object.entries(months)) {
          if (value > 0) {
            targets.push({
              groupId: Number(groupId),
              month: Number(month),
              value,
            });
          }
        }
      }

      const res = await fetch('/api/targets/groups/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets,
          year,
          ...(selectedDataTypeId
            ? { dataTypeId: Number(selectedDataTypeId) }
            : {}),
        }),
      });

      if (res.ok) {
        Dialog.success('保存しました');
        setHasChanges(false);
      } else {
        Dialog.error('保存に失敗しました');
      }
    } catch {
      Dialog.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const selectedDataType = dataTypes.find(
    (dt) => String(dt.id) === selectedDataTypeId,
  );
  const unitLabel = selectedDataType ? getUnitLabel(selectedDataType.unit) : '';

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    yearOptions.push({ value: String(y), label: `${y}年` });
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading && members.length === 0) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800">目標設定</h2>
        <div className="flex items-center gap-2">
          {dataTypes.length > 1 && (
            <div className="flex gap-1">
              {dataTypes.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setSelectedDataTypeId(String(dt.id))}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedDataTypeId === String(dt.id)
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                  style={
                    selectedDataTypeId === String(dt.id)
                      ? { backgroundColor: dt.color || '#3B82F6' }
                      : undefined
                  }
                >
                  {dt.name}
                </button>
              ))}
            </div>
          )}
          <Select
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={yearOptions}
          />
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setTab('individual')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'individual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          個人目標
        </button>
        <button
          onClick={() => setTab('group')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'group'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          グループ目標
        </button>
      </div>

      {/* テーブル */}
      {tab === 'individual' ? (
        <IndividualTargetTable
          members={members}
          months={months}
          targets={individualTargets}
          unitLabel={unitLabel}
          onChange={handleIndividualChange}
          onSave={saveIndividualTargets}
          saving={saving}
          hasChanges={hasChanges}
          loading={loading}
        />
      ) : (
        <GroupTargetTable
          groups={groups}
          months={months}
          groupTargets={groupTargets}
          unitLabel={unitLabel}
          onChange={handleGroupChange}
          onSave={saveGroupTargets}
          saving={saving}
          hasChanges={hasChanges}
          loading={loading}
          calcGroupMemberTotal={calcGroupMemberTotal}
        />
      )}
    </div>
  );
}
