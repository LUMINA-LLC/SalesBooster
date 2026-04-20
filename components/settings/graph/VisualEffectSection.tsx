'use client';

import { GraphConfig } from '@/types/graph';
import IntensityRow from './IntensityRow';

interface VisualEffectSectionProps {
  config: GraphConfig;
  onUpdate: <K extends keyof GraphConfig>(
    key: K,
    value: GraphConfig[K],
  ) => void;
}

export default function VisualEffectSection({
  config,
  onUpdate,
}: VisualEffectSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">視覚効果</h3>
      <div className="space-y-4">
        <IntensityRow
          label="グラデーション"
          value={config.gradientIntensity}
          onChange={(v) => onUpdate('gradientIntensity', v)}
        />
        <IntensityRow
          label="グロー(発光)"
          value={config.glowIntensity}
          onChange={(v) => onUpdate('glowIntensity', v)}
        />
      </div>
    </div>
  );
}
