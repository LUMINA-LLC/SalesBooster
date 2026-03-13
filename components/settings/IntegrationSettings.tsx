'use client';

import { useState, useEffect } from 'react';
import type { Integration } from './integrations/types';
import { SERVICE_DEFINITIONS } from './integrations/types';
import LineIntegrationCard from './integrations/LineIntegrationCard';
import GoogleChatIntegrationCard from './integrations/GoogleChatIntegrationCard';

export default function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      if (!res.ok) throw new Error();
      const dbData: Integration[] = await res.json();
      // サービス定義とDBデータをマージ（DBにないサービスもデフォルト値で表示）
      const merged = SERVICE_DEFINITIONS.map((def) => {
        const existing = dbData.find((d) => d.serviceKey === def.serviceKey);
        return (
          existing || {
            serviceKey: def.serviceKey,
            id: null,
            status: 'DISCONNECTED',
            config: null,
          }
        );
      });
      setIntegrations(merged);
    } catch {
      setIntegrations(
        SERVICE_DEFINITIONS.map((def) => ({
          serviceKey: def.serviceKey,
          id: null,
          status: 'DISCONNECTED',
          config: null,
        })),
      );
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

  const lineDef = SERVICE_DEFINITIONS.find((d) => d.serviceKey === 'LINE')!;
  const gchatDef = SERVICE_DEFINITIONS.find(
    (d) => d.serviceKey === 'GOOGLE_CHAT',
  )!;
  const lineIntegration = integrations.find((i) => i.serviceKey === 'LINE')!;
  const googleChatIntegration = integrations.find(
    (i) => i.serviceKey === 'GOOGLE_CHAT',
  )!;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">外部連携設定</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <LineIntegrationCard
          integration={lineIntegration}
          service={lineDef}
          onRefresh={fetchIntegrations}
          showMsg={showMsg}
        />

        <GoogleChatIntegrationCard
          integration={googleChatIntegration}
          service={gchatDef}
          onRefresh={fetchIntegrations}
          showMsg={showMsg}
        />
      </div>
    </div>
  );
}
