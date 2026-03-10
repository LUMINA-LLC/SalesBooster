'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import { useIntegrationActions } from './useIntegrationActions';
import type { CardProps } from './types';

export default function GoogleChatIntegrationCard({ integration, onRefresh, showMsg }: CardProps) {
  const [webhookUrl, setWebhookUrl] = useState(integration.config?.webhookUrl || '');
  const [showUrl, setShowUrl] = useState(false);
  const { saving, testing, setTesting, toggling, saveConfig, toggleStatus } = useIntegrationActions(integration, onRefresh, showMsg);

  useEffect(() => {
    setWebhookUrl(integration.config?.webhookUrl || '');
  }, [integration]);

  const isConnected = integration.status === 'CONNECTED';
  const hasConfig = !!integration.config?.webhookUrl;
  const canSave = webhookUrl.trim();

  const handleSave = () => {
    if (!canSave) {
      showMsg('error', 'Webhook URL を入力してください。');
      return;
    }
    saveConfig({ webhookUrl: webhookUrl.trim() });
  };

  const handleTest = async () => {
    if (!canSave) {
      showMsg('error', 'Webhook URL を入力してください。');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'google-chat', webhookUrl: webhookUrl.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        showMsg('success', 'テスト送信に成功しました。Google Chat スペースを確認してください。');
      } else {
        showMsg('error', data?.error || 'テスト送信に失敗しました。');
      }
    } catch {
      showMsg('error', 'テスト送信に失敗しました。');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <img src="/google-chat-icon.svg" alt="Google Chat" className="w-12 h-12 rounded-lg" />
          <div>
            <div className="font-semibold text-gray-800">Google Chat</div>
            <div className="text-sm text-gray-500">{integration.description}</div>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
          isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {isConnected ? '接続済み' : '未接続'}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
          <div className="flex items-center space-x-2">
            <input
              type={showUrl ? 'text' : 'password'}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Google Chat スペースの Webhook URL を入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowUrl(!showUrl)}
              className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showUrl ? '隠す' : '表示'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Google Chat のスペース設定 → アプリと統合 → Webhook から URL を取得できます。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-200">
        <Button label={testing ? '送信中...' : 'テスト送信'} onClick={handleTest} color="gray" variant="outline" disabled={testing || !canSave} />
        <Button label={saving ? '保存中...' : '設定を保存'} onClick={handleSave} color="blue" disabled={saving || !canSave} />
        <Button
          label={toggling ? '処理中...' : (isConnected ? '切断' : '接続')}
          onClick={toggleStatus}
          color={isConnected ? 'red' : 'green'}
          variant={isConnected ? 'outline' : 'solid'}
          disabled={toggling || (!hasConfig && !isConnected)}
        />
      </div>

      {!hasConfig && !isConnected && (
        <p className="mt-3 text-xs text-gray-400">接続するには、先に設定を保存してください。</p>
      )}
    </div>
  );
}
