import { TenantDetail } from './types';

interface Props {
  tenant: TenantDetail;
}

export default function StatsTab({ tenant }: Props) {
  const stats = [
    { label: 'メンバー数', value: tenant._count.users },
    { label: '部署数', value: tenant._count.departments },
    { label: 'グループ数', value: tenant._count.groups },
    { label: '売上レコード', value: tenant._count.salesRecords },
    { label: '目標設定', value: tenant._count.targets },
    { label: '外部連携', value: tenant._count.integrations },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-6 text-center"
          >
            <p className="text-3xl font-bold text-gray-800">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
