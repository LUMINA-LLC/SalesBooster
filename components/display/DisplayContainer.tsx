'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DisplayConfig, DEFAULT_DISPLAY_CONFIG } from '@/types/display';
import DisplayConfigPicker from '@/components/display/DisplayConfigPicker';
import DisplayContent from '@/components/display/DisplayContent';
import DisplaySpinner from '@/components/display/DisplaySpinner';

/**
 * ディスプレイ設定をロードし、表示・選択画面を出し分けるコンテナ。
 * - ?configId=X 指定: その設定を表示
 * - 未指定: 設定が1件なら自動表示、複数なら選択画面
 */
export default function DisplayContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configIdParam = searchParams.get('configId');

  const [config, setConfig] = useState<DisplayConfig | null>(null);
  // configId 未指定で複数設定があるときの選択肢
  const [pickerConfigs, setPickerConfigs] = useState<
    { id: number; name: string }[] | null
  >(null);
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    let active = true;
    // configId が変わって同一ページが再評価される際、前回の選択画面を確実に閉じる
    setPickerConfigs(null);
    const applyConfig = (data: unknown) => {
      const d = data as DisplayConfig;
      if (!d || !d.views || !Array.isArray(d.views)) {
        setConfig(DEFAULT_DISPLAY_CONFIG);
      } else {
        setConfig({ ...DEFAULT_DISPLAY_CONFIG, ...d });
      }
    };

    const load = async () => {
      // configId 指定あり: その設定を表示
      if (configIdParam) {
        try {
          const res = await fetch(
            `/api/settings/display?configId=${configIdParam}`,
          );
          if (!res.ok) throw new Error('not found');
          const data = await res.json();
          if (active) applyConfig(data);
        } catch {
          if (active) setConfig(DEFAULT_DISPLAY_CONFIG);
        }
        return;
      }

      // configId 未指定: 一覧を取得。1件ならそれを表示、複数なら選択画面。
      try {
        const res = await fetch('/api/settings/display/list');
        const list: DisplayConfig[] = res.ok ? await res.json() : [];
        if (!active) return;
        if (!Array.isArray(list) || list.length === 0) {
          setConfig(DEFAULT_DISPLAY_CONFIG);
        } else if (list.length === 1) {
          applyConfig(list[0]);
        } else {
          setPickerConfigs(
            list.map((c) => ({ id: c.id ?? 0, name: c.name ?? '(無名)' })),
          );
        }
      } catch {
        if (active) setConfig(DEFAULT_DISPLAY_CONFIG);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [configIdParam]);

  // 複数設定の選択画面
  if (pickerConfigs) {
    return (
      <DisplayConfigPicker
        configs={pickerConfigs}
        onSelect={(id) => router.push(`/display?configId=${id}`)}
        onBack={() => router.push('/')}
      />
    );
  }

  if (!config) {
    return <DisplaySpinner />;
  }

  return (
    <DisplayContent
      config={config}
      showHeader={showHeader}
      setShowHeader={setShowHeader}
      onExit={() => router.push('/')}
    />
  );
}
