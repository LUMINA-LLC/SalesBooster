'use client';

import { useState } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Button from '@/components/common/Button';

export default function AdminSettingsPage() {
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [requireUppercase, setRequireUppercase] = useState(false);
  const [requireNumber, setRequireNumber] = useState(false);
  const [requireSpecialChar, setRequireSpecialChar] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: APIエンドポイント実装後に接続
      await new Promise((resolve) => setTimeout(resolve, 500));
      await Dialog.success('設定を保存しました');
    } catch {
      await Dialog.error('設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">システム設定</h2>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* パスワードポリシー */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            パスワードポリシー
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最小パスワード長
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={minPasswordLength}
                  onChange={(e) =>
                    setMinPasswordLength(parseInt(e.target.value) || 8)
                  }
                  min={6}
                  max={32}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">文字</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireUppercase}
                  onChange={(e) => setRequireUppercase(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  大文字を必須にする
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireNumber}
                  onChange={(e) => setRequireNumber(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">数字を必須にする</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireSpecialChar}
                  onChange={(e) => setRequireSpecialChar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  特殊文字を必須にする
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* セッション設定 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            セッション設定
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              セッションタイムアウト
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) =>
                  setSessionTimeout(parseInt(e.target.value) || 30)
                }
                min={5}
                max={1440}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">分</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              無操作でログアウトされるまでの時間
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            label={saving ? '保存中...' : '設定を保存'}
            onClick={handleSave}
            disabled={saving}
          />
        </div>
      </div>
    </main>
  );
}
