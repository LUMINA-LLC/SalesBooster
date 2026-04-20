'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';
import RankingColorSection from './graph/RankingColorSection';
import BarStyleSection from './graph/BarStyleSection';
import VisualEffectSection from './graph/VisualEffectSection';
import DisplayOptionSection from './graph/DisplayOptionSection';
import DashboardDefaultSection from './graph/DashboardDefaultSection';

const AUTO_SAVE_DELAY_MS = 800;

export default function GraphSettings() {
  const [config, setConfig] = useState<GraphConfig>(DEFAULT_GRAPH_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    fetch('/api/settings/graph')
      .then((res) => (res.ok ? res.json() : DEFAULT_GRAPH_CONFIG))
      .then((data: GraphConfig) => setConfig(data))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 100);
      });
  }, []);

  const saveConfig = useCallback(async (nextConfig: GraphConfig) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/settings/graph', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch {
      setSaveStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConfig(config);
    }, AUTO_SAVE_DELAY_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [config, saveConfig]);

  const update = useCallback(
    <K extends keyof GraphConfig>(key: K, value: GraphConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">グラフ設定</h2>
        <span className="text-xs text-gray-500">
          {saveStatus === 'saving' && '保存中...'}
          {saveStatus === 'saved' && '保存しました'}
        </span>
      </div>

      <div className="space-y-6">
        <RankingColorSection config={config} onUpdate={update} />
        <BarStyleSection config={config} onUpdate={update} />
        <VisualEffectSection config={config} onUpdate={update} />
        <DisplayOptionSection config={config} onUpdate={update} />
        <DashboardDefaultSection config={config} onUpdate={update} />
      </div>
    </div>
  );
}
