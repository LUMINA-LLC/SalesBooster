import { TenantDetail, PLAN_TYPE_LABELS, ACTION_LABELS, ACTION_COLORS, formatDate, formatDateTime } from './types';

interface Props {
  tenant: TenantDetail;
}

export default function HistoryTab({ tenant }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">契約履歴</h3>
        </div>
        {tenant.subscriptionHistories.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">履歴がありません</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">アクション</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">プラン</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">上限</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">期間</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenant.subscriptionHistories.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(h.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[h.action] || 'bg-gray-100 text-gray-700'}`}>
                      {ACTION_LABELS[h.action] || h.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {h.planType ? PLAN_TYPE_LABELS[h.planType] || h.planType : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {h.maxMembers !== null ? `${h.maxMembers}名` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {h.startDate && h.endDate
                      ? `${formatDate(h.startDate)} 〜 ${formatDate(h.endDate)}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{h.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
