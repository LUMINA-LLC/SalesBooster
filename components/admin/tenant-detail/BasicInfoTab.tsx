import { TenantDetail, formatDateTime } from './types';

interface Props {
  tenant: TenantDetail;
}

export default function BasicInfoTab({ tenant }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-1">テナント名</label>
            <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">会社アカウント</label>
            <p className="text-sm font-mono text-gray-700">{tenant.slug}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">ステータス</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {tenant.isActive ? '有効' : '無効'}
            </span>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">テナントID</label>
            <p className="text-sm text-gray-700">{tenant.id}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">作成日</label>
            <p className="text-sm text-gray-700">{formatDateTime(tenant.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">最終更新日</label>
            <p className="text-sm text-gray-700">{formatDateTime(tenant.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
