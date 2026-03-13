'use client';

import Image from 'next/image';

interface GroupInfo {
  id: number;
  name: string;
  imageUrl?: string | null;
  memberCount: number;
  memberList: string[];
}

interface GroupTargetTableProps {
  groups: GroupInfo[];
  months: number[];
  groupTargets: Record<number, Record<number, number>>;
  unitLabel: string;
  onChange: (groupId: number, month: number, value: string) => void;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
  loading: boolean;
  calcGroupMemberTotal: (group: GroupInfo, month: number) => number;
}

export default function GroupTargetTable({
  groups,
  months,
  groupTargets,
  unitLabel,
  onChange,
  onSave,
  saving,
  hasChanges,
  loading,
  calcGroupMemberTotal,
}: GroupTargetTableProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        メンバー合計は個人目標の合算値です。手動で上書きする場合は値を入力してください。
      </p>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-r border-gray-200 min-w-[140px]">
                グループ
              </th>
              {months.map((m) => (
                <th
                  key={m}
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 min-w-[100px]"
                >
                  {m}月
                </th>
              ))}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 min-w-[90px] bg-blue-50">
                年間合計
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, idx) => {
              const yearTotal = months.reduce((sum, m) => {
                const manual = groupTargets[group.id]?.[m];
                return sum + (manual || calcGroupMemberTotal(group, m));
              }, 0);
              return (
                <tr
                  key={group.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td
                    className="sticky left-0 z-10 px-3 py-1.5 text-sm font-medium text-gray-800 border-r border-gray-200"
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
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
                            <span className="text-white text-[10px] font-bold">
                              {group.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="whitespace-nowrap">{group.name}</span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {group.memberCount}名
                      </span>
                    </div>
                  </td>
                  {months.map((m) => {
                    const memberTotal = calcGroupMemberTotal(group, m);
                    const manualValue = groupTargets[group.id]?.[m];
                    const hasManual =
                      manualValue !== undefined && manualValue > 0;
                    return (
                      <td key={m} className="px-1 py-1">
                        <div className="text-[10px] text-gray-400 text-right mb-0.5">
                          合計:{' '}
                          {memberTotal > 0 ? memberTotal.toLocaleString() : '0'}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={hasManual ? manualValue : ''}
                          onChange={(e) =>
                            onChange(group.id, m, e.target.value)
                          }
                          placeholder={
                            memberTotal > 0 ? String(memberTotal) : '0'
                          }
                          className={`w-full px-1.5 py-1 text-sm text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-transparent ${
                            hasManual
                              ? 'border-orange-300 bg-orange-50/50'
                              : 'border-gray-200'
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-sm text-right font-medium text-blue-700 bg-blue-50/50">
                    {yearTotal > 0
                      ? `${yearTotal.toLocaleString()}${unitLabel}`
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {groups.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400 text-sm">
          グループが登録されていません
        </div>
      )}
      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">
          読み込み中...
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className={`px-6 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
            saving || !hasChanges
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
