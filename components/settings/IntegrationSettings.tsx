'use client';

import { useState, useEffect } from 'react';
import type { Integration } from './integrations/types';
import LineIntegrationCard from './integrations/LineIntegrationCard';
import GoogleChatIntegrationCard from './integrations/GoogleChatIntegrationCard';

export default function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIntegrations(data);
    } catch {
      setMessage({ type: 'error', text: '連携情報の取得に失敗しました。' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  const lineIntegration = integrations.find((i) => i.name === 'LINE Messaging API') || null;
  const googleChatIntegration = integrations.find((i) => i.name === 'Google Chat') || null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">外部連携設定</h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {lineIntegration && (
          <LineIntegrationCard
            integration={lineIntegration}
            onRefresh={fetchIntegrations}
            showMsg={showMsg}
          />
        )}

        {googleChatIntegration && (
          <GoogleChatIntegrationCard
            integration={googleChatIntegration}
            onRefresh={fetchIntegrations}
            showMsg={showMsg}
          />
        )}

        {!lineIntegration && !googleChatIntegration && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-3">連携設定が見つかりません。</div>
            <button onClick={fetchIntegrations} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">再読み込み</button>
          </div>
        )}
      </div>
    </div>
  );
}
