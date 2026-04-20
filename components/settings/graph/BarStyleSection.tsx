'use client';

import { GraphConfig, BAR_STYLE_OPTIONS } from '@/types/graph';

interface BarStyleSectionProps {
  config: GraphConfig;
  onUpdate: <K extends keyof GraphConfig>(
    key: K,
    value: GraphConfig[K],
  ) => void;
}

export default function BarStyleSection({
  config,
  onUpdate,
}: BarStyleSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">バースタイル</h3>
      <div className="flex flex-wrap gap-2">
        {BAR_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onUpdate('barStyle', opt.value)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              config.barStyle === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
