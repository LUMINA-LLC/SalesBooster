'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/common/Button';
import { useIntegrationActions } from './useIntegrationActions';
import type { CardProps } from './types';

export default function LineIntegrationCard({
  integration,
  service,
  onRefresh,
  showMsg,
}: CardProps) {
  const [channelAccessToken, setChannelAccessToken] = useState(
    integration.config?.channelAccessToken || '',
  );
  const [groupId, setGroupId] = useState(integration.config?.groupId || '');
  const [showToken, setShowToken] = useState(false);
  const { saving, testing, setTesting, toggling, saveConfig, toggleStatus } =
    useIntegrationActions(integration, onRefresh, showMsg);

  useEffect(() => {
    setChannelAccessToken(integration.config?.channelAccessToken || '');
    setGroupId(integration.config?.groupId || '');
  }, [integration]);

  const isConnected = integration.status === 'CONNECTED';
  const hasConfig = !!(
    integration.config?.channelAccessToken && integration.config?.groupId
  );
  const canSave = channelAccessToken.trim() && groupId.trim();

  const handleSave = () => {
    if (!canSave) {
      showMsg('error', 'Channel Access Token と Group ID を入力してください。');
      return;
    }
    saveConfig({
      channelAccessToken: channelAccessToken.trim(),
      groupId: groupId.trim(),
    });
  };

  const handleTest = async () => {
    if (!canSave) {
      showMsg('error', 'Channel Access Token と Group ID を入力してください。');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelAccessToken: channelAccessToken.trim(),
          groupId: groupId.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        showMsg(
          'success',
          'テスト送信に成功しました。LINEグループを確認してください。',
        );
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
          <Image
            src="/line-icon.svg"
            alt="LINE"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <div>
            <div className="font-semibold text-gray-800">{service.name}</div>
            <div className="text-sm text-gray-500">{service.description}</div>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs rounded-full font-medium ${
            isConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isConnected ? '接続済み' : '未接続'}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel Access Token
          </label>
          <div className="flex items-center space-x-2">
            <input
              type={showToken ? 'text' : 'password'}
              value={channelAccessToken}
              onChange={(e) => setChannelAccessToken(e.target.value)}
              placeholder="Channel Access Token を入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showToken ? '隠す' : '表示'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group ID
          </label>
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="通知先のグループ ID を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-200">
        <Button
          label={testing ? '送信中...' : 'テスト送信'}
          onClick={handleTest}
          color="gray"
          variant="outline"
          disabled={testing || !canSave}
        />
        <Button
          label={saving ? '保存中...' : '設定を保存'}
          onClick={handleSave}
          color="blue"
          disabled={saving || !canSave}
        />
        <Button
          label={toggling ? '処理中...' : isConnected ? '切断' : '接続'}
          onClick={toggleStatus}
          color={isConnected ? 'red' : 'green'}
          variant={isConnected ? 'outline' : 'solid'}
          disabled={toggling || (!hasConfig && !isConnected)}
        />
      </div>

      {!hasConfig && !isConnected && (
        <p className="mt-3 text-xs text-gray-400">
          接続するには、先に設定を保存してください。
        </p>
      )}
    </div>
  );
}
