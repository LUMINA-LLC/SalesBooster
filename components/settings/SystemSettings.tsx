'use client';

import { useState } from 'react';
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
          <h3 className="font-semibold text-gray-800 mb-4">初期セットアップ</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">
                セットアップウィザード
              </div>
              <div className="text-xs text-gray-500">
                グループ・メンバー・データ種類の初期設定を再実行します
              </div>
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
