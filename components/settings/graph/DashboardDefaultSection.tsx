'use client';

import {
  GraphConfig,
  DEFAULT_GRAPH_TYPE_OPTIONS,
  DefaultGraphType,
  DEFAULT_PERIOD_UNIT_OPTIONS,
  DefaultPeriodUnit,
} from '@/types/graph';

interface DashboardDefaultSectionProps {
  config: GraphConfig;
  onUpdate: <K extends keyof GraphConfig>(
    key: K,
    value: GraphConfig[K],
  ) => void;
}

export default function DashboardDefaultSection({
  config,
  onUpdate,
}: DashboardDefaultSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-1">
        ダッシュボード初期表示
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        ダッシュボード画面を開いたときの初期状態です（ディスプレイモードには適用されません）
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            デフォルトグラフ
          </div>
          <select
            value={config.defaultGraphType}
            onChange={(e) =>
              onUpdate('defaultGraphType', e.target.value as DefaultGraphType)
            }
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            {DEFAULT_GRAPH_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            デフォルト期間単位
          </div>
          <div className="flex gap-1">
            {DEFAULT_PERIOD_UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onUpdate('defaultPeriodUnit', opt.value as DefaultPeriodUnit)
                }
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  config.defaultPeriodUnit === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
