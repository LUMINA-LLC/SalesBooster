'use client';

import { useState, useEffect } from 'react';

interface LicenseStatus {
  planType: 'TRIAL' | 'STANDARD' | 'ENTERPRISE' | null;
  maxMembers: number | null;
  currentMembers: number;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
}

interface SubscriptionHistory {
  id: number;
  action: string;
  planType: string | null;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'トライアル',
  STANDARD: 'スタンダード',
  ENTERPRISE: 'エンタープライズ',
};

const ACTION_LABELS: Record<string, string> = {
  TRIAL_START: 'トライアル開始',
  CREATE: '契約作成',
  UPDATE: '契約更新',
  RENEW: '契約更新',
  EXPIRE: '期限切れ',
};

const ACTION_COLORS: Record<string, string> = {
  TRIAL_START: 'bg-blue-100 text-blue-800',
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  RENEW: 'bg-green-100 text-green-800',
  EXPIRE: 'bg-red-100 text-red-800',
};

function formatDate(iso: string | null): string {
  if (!iso) return '未設定';
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LicenseSettings() {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [histories, setHistories] = useState<SubscriptionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/license').then((res) => res.json()),
      fetch('/api/license/history').then((res) => res.ok ? res.json() : []),
    ])
      .then(([licenseData, historyData]) => {
        setLicense(licenseData);
        setHistories(Array.isArray(historyData) ? historyData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">契約情報</h2>
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!license) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">契約情報</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500">契約情報を取得できませんでした。</p>
        </div>
      </div>
    );
  }

  const statusBadge = () => {
    if (license.isExpired) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">期限切れ</span>;
    }
    if (license.isTrial) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">トライアル中</span>;
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">有効</span>;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">契約情報</h2>

      {/* ステータスバナー */}
      {license.isExpired && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">ライセンスの有効期限が切れています</p>
            <p className="text-sm text-red-700 mt-1">データの閲覧は可能ですが、新規登録・編集・削除などの操作が制限されています。契約の更新については管理者にお問い合わせください。</p>
          </div>
        </div>
      )}

      {license.isTrial && !license.isExpired && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">トライアル期間中です</p>
            <p className="text-sm text-yellow-700 mt-1">
              {license.daysRemaining !== null
                ? `残り${license.daysRemaining}日でトライアル期間が終了します。`
                : 'トライアル期間中です。'}
              引き続きご利用いただくには、有料プランへの切り替えが必要です。
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 契約ステータス */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">契約ステータス</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">プラン</label>
              <p className="text-lg font-semibold text-gray-900">
                {license.planType ? PLAN_LABELS[license.planType] || license.planType : '未設定'}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">ステータス</label>
              <div className="mt-0.5">{statusBadge()}</div>
            </div>
          </div>
        </div>

        {/* 利用状況 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">利用状況</h3>
          <div>
            <label className="block text-sm text-gray-500 mb-2">メンバー数</label>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{license.currentMembers}</span>
              <span className="text-gray-500">/</span>
              <span className="text-lg text-gray-600">{license.maxMembers ?? '無制限'}</span>
              <span className="text-sm text-gray-400">人</span>
            </div>
            {license.maxMembers !== null && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      license.currentMembers / license.maxMembers > 0.9
                        ? 'bg-red-500'
                        : license.currentMembers / license.maxMembers > 0.7
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (license.currentMembers / license.maxMembers) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  上限の{Math.round((license.currentMembers / license.maxMembers) * 100)}%を使用中
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 契約期間 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">契約期間</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">開始日</label>
              <p className="text-sm font-medium text-gray-900">{formatDate(license.licenseStartDate)}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">終了日</label>
              <p className="text-sm font-medium text-gray-900">{formatDate(license.licenseEndDate)}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">残り日数</label>
              <p className={`text-sm font-medium ${
                license.isExpired
                  ? 'text-red-600'
                  : license.daysRemaining !== null && license.daysRemaining <= 30
                    ? 'text-yellow-600'
                    : 'text-gray-900'
              }`}>
                {license.daysRemaining !== null
                  ? license.isExpired
                    ? '期限切れ'
                    : `${license.daysRemaining}日`
                  : '無期限'}
              </p>
            </div>
          </div>
        </div>

        {/* 契約履歴 */}
        {histories.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">契約履歴</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {histories.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 whitespace-nowrap text-xs mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${ACTION_COLORS[h.action] || 'bg-gray-100 text-gray-700'}`}>
                    {ACTION_LABELS[h.action] || h.action}
                  </span>
                  <span className="text-gray-600">
                    {h.planType && (PLAN_LABELS[h.planType] || h.planType)}
                    {h.startDate && h.endDate && (
                      <span className="text-gray-400 ml-1">
                        ({new Date(h.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(h.endDate).toLocaleDateString('ja-JP')})
                      </span>
                    )}
                    {h.note && <span className="text-gray-400 ml-1">- {h.note}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 注意書き */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500">
            契約内容の変更やプランの切り替えについては、システム管理者にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
