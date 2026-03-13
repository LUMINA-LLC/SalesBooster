'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Select from '@/components/common/Select';

interface GroupOption {
  id: number;
  name: string;
  imageUrl?: string | null;
  memberList: { id: string; name: string }[];
}

interface MemberOption {
  id: string;
  name: string;
}

interface GroupMemberSelectorProps {
  onFilterChange?: (filter: { groupId: string; memberId: string }) => void;
}

export default function GroupMemberSelector({
  onFilterChange,
}: GroupMemberSelectorProps) {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  useEffect(() => {
    fetch('/api/groups')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setGroups(data))
      .catch(() => setGroups([]));

    fetch('/api/members')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setAllMembers(data))
      .catch(() => setAllMembers([]));
  }, []);

  const selectedGroup = groups.find((g) => g.id === Number(selectedGroupId));
  const memberOptions = selectedGroupId
    ? selectedGroup?.memberList || []
    : allMembers;

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    setSelectedMemberId('');
    onFilterChange?.({ groupId: value, memberId: '' });
  };

  const handleMemberChange = (value: string) => {
    setSelectedMemberId(value);
    onFilterChange?.({ groupId: selectedGroupId, memberId: value });
  };

  const groupOptions = [
    { value: '', label: 'すべて' },
    ...groups.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  const memberSelectOptions = [
    { value: '', label: '全員' },
    ...memberOptions.map((m) => ({ value: String(m.id), label: m.name })),
  ];

  return (
    <div className="flex items-center space-x-4">
      {selectedGroup && (
        <div className="relative w-8 h-8 rounded-sm overflow-hidden border border-gray-200 shadow-sm shrink-0">
          {selectedGroup.imageUrl ? (
            <Image
              src={selectedGroup.imageUrl}
              alt={selectedGroup.name}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
              <span className="text-white text-xs font-bold">
                {selectedGroup.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">グループ</label>
        <Select
          value={selectedGroupId}
          onChange={handleGroupChange}
          options={groupOptions}
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">メンバー</label>
        <Select
          value={selectedMemberId}
          onChange={handleMemberChange}
          options={memberSelectOptions}
        />
      </div>
    </div>
  );
}
