'use client';

import {
  DisplayConfig,
  TransitionType,
  DataRefreshInterval,
  DATA_REFRESH_INTERVAL_OPTIONS,
} from '@/types/display';
import Select from '@/components/common/Select';

interface PlaybackSettingsSectionProps {
  config: DisplayConfig;
  onConfigChange: (updater: (prev: DisplayConfig) => DisplayConfig) => void;
}

export default function PlaybackSettingsSection({
  config,
  onConfigChange,
}: PlaybackSettingsSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">再生設定</h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">ループ再生</div>
            <div className="text-xs text-gray-500">
              最後のビューの後に最初に戻る
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.loop}
              onChange={(e) =>
                onConfigChange((prev) => ({ ...prev, loop: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">
              データ更新間隔
            </div>
            <div className="text-xs text-gray-500">
              売上データの自動更新間隔
            </div>
          </div>
          <Select
            value={config.dataRefreshInterval}
            onChange={(v) =>
              onConfigChange((prev) => ({
                ...prev,
                dataRefreshInterval: v as DataRefreshInterval,
              }))
            }
            options={DATA_REFRESH_INTERVAL_OPTIONS}
            className="w-full sm:w-auto sm:min-w-[200px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">
              トランジション効果
            </div>
            <div className="text-xs text-gray-500">
              ビュー切替時のアニメーション
            </div>
          </div>
          <Select
            value={config.transition}
            onChange={(v) =>
              onConfigChange((prev) => ({
                ...prev,
                transition: v as TransitionType,
              }))
            }
            options={[
              { value: 'NONE', label: 'なし' },
              { value: 'FADE', label: 'フェード' },
              { value: 'SLIDE_LEFT', label: 'スライド（左）' },
              { value: 'SLIDE_RIGHT', label: 'スライド（右）' },
            ]}
            className="w-full sm:w-auto sm:min-w-[200px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">
              ダークモード
            </div>
            <div className="text-xs text-gray-500">
              ディスプレイ画面を暗い配色にする
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.darkMode}
              onChange={(e) =>
                onConfigChange((prev) => ({
                  ...prev,
                  darkMode: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">
              速報メッセージ
            </div>
            <div className="text-xs text-gray-500">
              新規データ入力時に速報動画と一緒に表示するメッセージ
            </div>
          </div>
          <input
            type="text"
            value={config.breakingNewsMessage}
            onChange={(e) =>
              onConfigChange((prev) => ({
                ...prev,
                breakingNewsMessage: e.target.value,
              }))
            }
            placeholder="おめでとう！"
            className="w-full sm:w-auto sm:min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
