'use client';

import { GraphConfig } from '@/types/graph';
import ToggleRow from './ToggleRow';

interface DisplayOptionSectionProps {
  config: GraphConfig;
  onUpdate: <K extends keyof GraphConfig>(
    key: K,
    value: GraphConfig[K],
  ) => void;
}

export default function DisplayOptionSection({
  config,
  onUpdate,
}: DisplayOptionSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">表示オプション</h3>
      <div className="space-y-4">
        <ToggleRow
          label="目標ライン表示"
          description="グラフ上に目標達成ラインを表示します"
          value={config.showNormaLine}
          onChange={(v) => onUpdate('showNormaLine', v)}
        />
        <ToggleRow
          label="ダークモード"
          description="背景を暗くし、大画面に映えるデザインにします"
          value={config.darkMode}
          onChange={(v) => onUpdate('darkMode', v)}
        />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">
              ランキング表示件数
            </div>
            <div className="text-xs text-gray-500">
              空欄で全員表示。上位何名まで表示するか
            </div>
          </div>
          <input
            type="number"
            min={1}
            value={config.rankingLimit ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onUpdate('rankingLimit', v === '' ? null : Number(v));
            }}
            placeholder="全員"
            className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right"
          />
        </div>
      </div>
    </div>
  );
}
