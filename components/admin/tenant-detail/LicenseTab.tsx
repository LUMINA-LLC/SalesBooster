import { TenantDetail, PLAN_TYPE_LABELS, formatDate } from './types';

function getLicenseStatusBadge(tenant: TenantDetail) {
  if (!tenant.planType || !tenant.licenseEndDate) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">未設定（期限切れ扱い）</span>;
  }
  const end = new Date(tenant.licenseEndDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (now > end) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">期限切れ</span>;
  }
  if (daysRemaining <= 7) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">残り{daysRemaining}日</span>;
  }
  if (tenant.isTrial) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">トライアル中 (残り{daysRemaining}日)</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">有効 (残り{daysRemaining}日)</span>;
}

interface Props {
  tenant: TenantDetail;
}

export default function LicenseTab({ tenant }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">契約・ライセンス</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-1">プラン</label>
            <p className="text-sm font-medium text-gray-900">
              {tenant.planType ? PLAN_TYPE_LABELS[tenant.planType] || tenant.planType : '未設定'}
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">ライセンス状態</label>
            <div>{getLicenseStatusBadge(tenant)}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">メンバー数</label>
            <p className="text-sm text-gray-900">
              {tenant.maxMembers !== null
                ? `${tenant._count.users} / ${tenant.maxMembers}名`
                : `${tenant._count.users}名 (無制限)`}
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">トライアル</label>
            <p className="text-sm text-gray-900">{tenant.isTrial ? 'はい' : 'いいえ'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">開始日</label>
            <p className="text-sm text-gray-900">{tenant.licenseStartDate ? formatDate(tenant.licenseStartDate) : '未設定'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">終了日</label>
            <p className="text-sm text-gray-900">{tenant.licenseEndDate ? formatDate(tenant.licenseEndDate) : '未設定'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
