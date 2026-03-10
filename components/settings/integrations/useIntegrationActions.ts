'use client';

import { useState } from 'react';
import type { Integration } from './types';

export function useIntegrationActions(
  integration: Integration,
  onRefresh: () => Promise<void>,
  showMsg: (type: 'success' | 'error', text: string) => void,
) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const saveConfig = async (config: Record<string, string>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        await onRefresh();
        showMsg('success', '設定を保存しました。');
      } else {
        const data = await res.json().catch(() => null);
        showMsg('error', data?.error || '設定の保存に失敗しました。');
      }
    } catch {
      showMsg('error', '設定の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = integration.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    setToggling(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await onRefresh();
        showMsg('success', newStatus === 'CONNECTED' ? '接続しました。' : '切断しました。');
      } else {
        const data = await res.json().catch(() => null);
        showMsg('error', data?.error || 'ステータスの更新に失敗しました。');
      }
    } catch {
      showMsg('error', 'ステータスの更新に失敗しました。');
    } finally {
      setToggling(false);
    }
  };

  return { saving, testing, setTesting, toggling, saveConfig, toggleStatus };
}
