'use client';

import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import type { GroupOption, MemberOption, DataTypeOption } from './types';

interface RecordsFilterBarProps {
  startDate: string;
  endDate: string;
  groupId: string;
  memberId: string;
  filterDataTypeId: string;
  groups: GroupOption[];
  members: MemberOption[];
  dataTypes: DataTypeOption[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onMemberChange: (value: string) => void;
  onDataTypeChange: (value: string) => void;
  onSearch: () => void;
}

export default function RecordsFilterBar({
  startDate,
  endDate,
  groupId,
  memberId,
  filterDataTypeId,
  groups,
  members,
  dataTypes,
  onStartDateChange,
  onEndDateChange,
  onGroupChange,
  onMemberChange,
  onDataTypeChange,
  onSearch,
}: RecordsFilterBarProps) {
  const groupOptions = [
    { value: '', label: 'すべてのグループ' },
    ...groups.map((g) => ({ value: String(g.id), label: g.name })),
  ];
  const memberOptions = [
    { value: '', label: 'すべてのメンバー' },
    ...members.map((m) => ({ value: String(m.id), label: m.name })),
  ];
  const dataTypeOptions = [
    { value: '', label: 'すべてのデータ種別' },
    ...dataTypes.map((d) => ({ value: String(d.id), label: d.name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
      />
      <span className="text-gray-500 shrink-0">&mdash;</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
      />
      <Select
        value={groupId}
        onChange={(v) => {
          onGroupChange(v);
          if (v) onMemberChange('');
        }}
        options={groupOptions}
        placeholder="グループ"
        className="w-full sm:w-44"
      />
      <Select
        value={memberId}
        onChange={(v) => {
          onMemberChange(v);
          if (v) onGroupChange('');
        }}
        options={memberOptions}
        placeholder="メンバー"
        className="w-full sm:w-44"
      />
      <Select
        value={filterDataTypeId}
        onChange={onDataTypeChange}
        options={dataTypeOptions}
        placeholder="データ種別"
        className="w-full sm:w-44"
      />
      <Button label="検索" onClick={onSearch} className="shrink-0" />
    </div>
  );
}
