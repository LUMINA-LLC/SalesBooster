'use client';

import { GraphConfig } from '@/types/graph';
import ColorRow from './ColorRow';

interface RankingColorSectionProps {
  config: GraphConfig;
  onUpdate: <K extends keyof GraphConfig>(
    key: K,
    value: GraphConfig[K],
  ) => void;
}

export default function RankingColorSection({
  config,
  onUpdate,
}: RankingColorSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-1">ランキング配色</h3>
      <p className="text-xs text-gray-500 mb-4">
        ダッシュボードとディスプレイモード共通
      </p>
      <div className="space-y-4">
        <ColorRow
          label="TOP 20%"
          description="上位メンバーのバー色"
          value={config.topColor}
          onChange={(v) => onUpdate('topColor', v)}
        />
        <ColorRow
          label="CENTER"
          description="中位メンバーのバー色"
          value={config.centerColor}
          onChange={(v) => onUpdate('centerColor', v)}
        />
        <ColorRow
          label="LOW 20%"
          description="下位メンバーのバー色"
          value={config.lowColor}
          onChange={(v) => onUpdate('lowColor', v)}
        />
      </div>
    </div>
  );
}
