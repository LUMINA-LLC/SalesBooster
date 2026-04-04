import { TenantDetail, formatDate } from './types';

interface Props {
  tenant: TenantDetail;
}

export default function AdminsTab({ tenant }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">管理者一覧</h3>
          <span className="text-sm text-gray-500">
            {tenant.admins.length}名
          </span>
        </div>
        {tenant.admins.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            管理者が登録されていません
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tenant.admins.map((user) => (
              <div
                key={user.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {user.name || '(名前未設定)'}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  登録日: {formatDate(user.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
