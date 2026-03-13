'use client';

import { DisplayConfig } from '@/types/display';

interface DisplayInfoSectionProps {
  config: DisplayConfig;
  onConfigChange: (updater: (prev: DisplayConfig) => DisplayConfig) => void;
}

export default function DisplayInfoSection({
  config,
  onConfigChange,
}: DisplayInfoSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">表示情報設定</h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">チーム名</div>
            <div className="text-xs text-gray-500">
              ディスプレイ画面に表示するチーム名
            </div>
          </div>
          <input
            type="text"
            value={config.teamName}
            onChange={(e) =>
              onConfigChange((prev) => ({ ...prev, teamName: e.target.value }))
            }
            placeholder="例: 営業1課"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[200px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">会社ロゴURL</div>
            <div className="text-xs text-gray-500">
              ディスプレイ画面に表示するロゴ画像のURL
            </div>
          </div>
          <input
            type="url"
            value={config.companyLogoUrl}
            onChange={(e) =>
              onConfigChange((prev) => ({
                ...prev,
                companyLogoUrl: e.target.value,
              }))
            }
            placeholder="https://example.com/logo.png"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[300px]"
          />
        </div>
      </div>
    </div>
  );
}
