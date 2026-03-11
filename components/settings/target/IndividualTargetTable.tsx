'use client';

import Image from 'next/image';

interface MemberInfo {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface IndividualTargetTableProps {
  members: MemberInfo[];
  months: number[];
  targets: Record<string, Record<number, number>>;
  unitLabel: string;
  onChange: (userId: string, month: number, value: string) => void;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
  loading: boolean;
}

export default function IndividualTargetTable({
  members, months, targets, unitLabel, onChange, onSave, saving, hasChanges, loading,
}: IndividualTargetTableProps) {
  return (
    <div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-r border-gray-200 min-w-[120px]">
                メンバー
              </th>
              {months.map((m) => (
                <th key={m} className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 min-w-[80px]">
                  {m}月
                </th>
              ))}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 min-w-[90px] bg-blue-50">
                年間合計
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => {
              const yearTotal = months.reduce((sum, m) => sum + (targets[member.id]?.[m] || 0), 0);
              return (
                <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="sticky left-0 z-10 px-3 py-1.5 text-sm font-medium text-gray-800 border-r border-gray-200" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm shrink-0">
                        {member.imageUrl ? (
                          <Image src={member.imageUrl} alt={member.name} fill className="object-cover" sizes="24px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                            <span className="text-white text-[10px] font-bold">{(member.name || '?').charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <span className="truncate">{member.name || member.id}</span>
                    </div>
                  </td>
                  {months.map((m) => (
                    <td key={m} className="px-1 py-1">
                      <input
                        type="number"
                        min="0"
                        value={targets[member.id]?.[m] || ''}
                        onChange={(e) => onChange(member.id, m, e.target.value)}
                        placeholder="0"
                        className="w-full px-1.5 py-1 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-transparent"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-sm text-right font-medium text-blue-700 bg-blue-50/50">
                    {yearTotal > 0 ? `${yearTotal.toLocaleString()}${unitLabel}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {members.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-medium">
                <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2 text-sm text-gray-700 border-t border-r border-gray-200">合計</td>
                {months.map((m) => {
                  const monthTotal = members.reduce((sum, member) => sum + (targets[member.id]?.[m] || 0), 0);
                  return (
                    <td key={m} className="px-2 py-2 text-sm text-right text-gray-700 border-t border-gray-200">
                      {monthTotal > 0 ? monthTotal.toLocaleString() : '-'}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-sm text-right font-bold text-blue-800 border-t border-gray-200 bg-blue-50">
                  {(() => {
                    const total = members.reduce((sum, member) => sum + months.reduce((s, m) => s + (targets[member.id]?.[m] || 0), 0), 0);
                    return total > 0 ? `${total.toLocaleString()}${unitLabel}` : '-';
                  })()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {members.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400 text-sm">メンバーが登録されていません</div>
      )}
      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">読み込み中...</div>
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
