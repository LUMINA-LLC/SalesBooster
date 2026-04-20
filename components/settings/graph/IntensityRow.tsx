'use client';

import { EffectIntensity, EFFECT_INTENSITY_OPTIONS } from '@/types/graph';

interface IntensityRowProps {
  label: string;
  value: EffectIntensity;
  onChange: (value: EffectIntensity) => void;
}

export default function IntensityRow({
  label,
  value,
  onChange,
}: IntensityRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex gap-1">
        {EFFECT_INTENSITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              value === opt.value
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
