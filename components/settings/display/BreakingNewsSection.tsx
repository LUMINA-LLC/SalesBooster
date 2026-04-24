'use client';

import { useEffect, useState } from 'react';
import { BreakingNewsConfig, DisplayConfig } from '@/types/display';
import BreakingNewsTabs from './breakingNews/BreakingNewsTabs';
import BreakingNewsForm from './breakingNews/BreakingNewsForm';
import { DEFAULT_TAB_ID, type DataTypeOption } from './breakingNews/types';

interface BreakingNewsSectionProps {
  config: DisplayConfig;
  onConfigChange: (updater: (prev: DisplayConfig) => DisplayConfig) => void;
}

export default function BreakingNewsSection({
  config,
  onConfigChange,
}: BreakingNewsSectionProps) {
  const [dataTypes, setDataTypes] = useState<DataTypeOption[]>([]);
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB_ID);

  // データ種別が複数ある場合はデフォルトタブを非表示にする
  const hideDefaultTab = dataTypes.length >= 2;

  useEffect(() => {
    fetch('/api/data-types?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DataTypeOption[]) => {
        setDataTypes(data);
        // データ種別が複数あり、まだデフォルトタブが選択されている場合は
        // 先頭のデータ種別タブに切り替える
        if (data.length >= 2) {
          setActiveTab((prev) =>
            prev === DEFAULT_TAB_ID ? String(data[0].id) : prev,
          );
        }
      })
      .catch(() => setDataTypes([]));
  }, []);

  const findPerConfig = (dataTypeId: number): BreakingNewsConfig | undefined =>
    config.breakingNewsConfigs.find((c) => c.dataTypeId === dataTypeId);

  const updatePerConfig = (
    dataTypeId: number,
    patch: Partial<BreakingNewsConfig>,
  ) => {
    onConfigChange((prev) => {
      const existing = prev.breakingNewsConfigs.find(
        (c) => c.dataTypeId === dataTypeId,
      );
      const next: BreakingNewsConfig = existing
        ? { ...existing, ...patch }
        : {
            dataTypeId,
            enabled: true,
            message: null,
            videoId: null,
            ...patch,
          };
      const others = prev.breakingNewsConfigs.filter(
        (c) => c.dataTypeId !== dataTypeId,
      );
      return { ...prev, breakingNewsConfigs: [...others, next] };
    });
  };

  const isDefaultTab = activeTab === DEFAULT_TAB_ID;
  const activeDataTypeId = isDefaultTab ? null : Number(activeTab);
  const perConfig =
    activeDataTypeId !== null ? findPerConfig(activeDataTypeId) : undefined;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">速報設定</h3>

      <BreakingNewsTabs
        dataTypes={dataTypes}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        findPerConfig={findPerConfig}
        hideDefaultTab={hideDefaultTab}
      />

      <BreakingNewsForm
        isDefaultTab={isDefaultTab}
        hideDefaultFallback={hideDefaultTab}
        activeDataTypeId={activeDataTypeId}
        perConfig={perConfig}
        updatePerConfig={updatePerConfig}
      />
    </div>
  );
}
