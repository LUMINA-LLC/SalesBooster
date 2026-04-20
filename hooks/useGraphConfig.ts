'use client';

import { useState, useEffect } from 'react';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';

/**
 * グラフ設定を取得するフック。
 * 取得失敗時はデフォルト値を返す。
 */
export function useGraphConfig(): {
  config: GraphConfig;
  loading: boolean;
} {
  const [config, setConfig] = useState<GraphConfig>(DEFAULT_GRAPH_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/graph')
      .then((res) => (res.ok ? res.json() : DEFAULT_GRAPH_CONFIG))
      .then((data: GraphConfig) => setConfig(data))
      .catch(() => setConfig(DEFAULT_GRAPH_CONFIG))
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
