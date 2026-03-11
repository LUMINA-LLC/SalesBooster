'use client';

import { useState } from 'react';
import Select from '@/components/common/Select';
import SetupWizard from '@/components/setup/SetupWizard';

export default function SystemSettings() {
  const [showWizard, setShowWizard] = useState(false);

  const handleRerunWizard = async () => {
    try {
      await fetch('/api/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCompleted: false }),
      });
    } catch (err) {
      console.error('Failed to reset setup status:', err);
    }
    setShowWizard(true);
  };

  const handleWizardComplete = async () => {
    try {
      await fetch('/api/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCompleted: true }),
      });
    } catch (err) {
      console.error('Failed to update setup status:', err);
    }
    setShowWizard(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">システム設定</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">基本設定</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue="株式会社サンプル" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会計年度開始月</label>
              <Select
                value="4月"
                onChange={() => {}}
                options={[
                  { value: '1月', label: '1月' },
                  { value: '4月', label: '4月' },
                  { value: '7月', label: '7月' },
                  { value: '10月', label: '10月' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">通貨単位</label>
              <Select
                value="万円"
                onChange={() => {}}
                options={[
                  { value: '万円', label: '万円' },
                  { value: '千円', label: '千円' },
                  { value: '円', label: '円' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">セキュリティ</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">二要素認証</div>
                <div className="text-xs text-gray-500">ログイン時に二要素認証を要求</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">セッションタイムアウト</div>
                <div className="text-xs text-gray-500">無操作時の自動ログアウト時間</div>
              </div>
              <Select
                value="30分"
                onChange={() => {}}
                options={[
                  { value: '30分', label: '30分' },
                  { value: '1時間', label: '1時間' },
                  { value: '2時間', label: '2時間' },
                  { value: 'なし', label: 'なし' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">初期セットアップ</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">セットアップウィザード</div>
              <div className="text-xs text-gray-500">グループ・メンバー・データ種類の初期設定を再実行します</div>
            </div>
            <button
              onClick={handleRerunWizard}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              ウィザードを起動
            </button>
          </div>
        </div>
      </div>

      {showWizard && (
        <SetupWizard
          onComplete={handleWizardComplete}
          onSkip={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
