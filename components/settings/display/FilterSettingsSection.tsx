'use client';

import { DisplayConfig } from '@/types/display';
import Select from '@/components/common/Select';

interface GroupOption {
  id: number;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface FilterSettingsSectionProps {
  config: DisplayConfig;
  groups: GroupOption[];
  members: MemberOption[];
  onConfigChange: (updater: (prev: DisplayConfig) => DisplayConfig) => void;
}

export default function FilterSettingsSection({
  config,
  groups,
  members,
  onConfigChange,
}: FilterSettingsSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">フィルター設定</h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">グループ</div>
            <div className="text-xs text-gray-500">表示対象のグループ</div>
          </div>
          <Select
            value={config.filter.groupId}
            onChange={(v) =>
              onConfigChange((prev) => ({
                ...prev,
                filter: { ...prev.filter, groupId: v, memberId: '' },
              }))
            }
            options={[
              { value: '', label: '全グループ' },
              ...groups.map((g) => ({ value: String(g.id), label: g.name })),
            ]}
            className="w-full sm:w-auto sm:min-w-[200px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">メンバー</div>
            <div className="text-xs text-gray-500">表示対象のメンバー</div>
          </div>
          <Select
            value={config.filter.memberId}
            onChange={(v) =>
              onConfigChange((prev) => ({
                ...prev,
                filter: { ...prev.filter, memberId: v },
              }))
            }
            options={[
              { value: '', label: '全メンバー' },
              ...members.map((m) => ({ value: String(m.id), label: m.name })),
            ]}
            className="w-full sm:w-auto sm:min-w-[200px]"
          />
        </div>
      </div>
    </div>
  );
}
