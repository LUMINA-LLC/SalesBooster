'use client';

import { DisplayConfig } from '@/types/display';

interface BreakingNewsSectionProps {
  config: DisplayConfig;
  onConfigChange: (updater: (prev: DisplayConfig) => DisplayConfig) => void;
}

const VIDEO_OPTIONS = [
  { id: '1', label: 'ノーマル', src: '/movies/1.mp4' },
  { id: '2', label: '表彰式', src: '/movies/2.mp4' },
  { id: '3', label: 'ファンタジスタ', src: '/movies/3.mp4' },
];

export default function BreakingNewsSection({
  config,
  onConfigChange,
}: BreakingNewsSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">速報設定</h3>
      <div className="space-y-4">
        {/* 速報メッセージ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-gray-700">
              速報メッセージ
            </div>
            <div className="text-xs text-gray-500">
              速報表示時にメンバー名の下に表示するメッセージ
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
            placeholder="例: おめでとう！"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[200px]"
          />
        </div>

        {/* 動画選択 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            速報エフェクト
          </div>
          <div className="text-xs text-gray-500 mb-3">
            売上データ登録時に再生される速報動画を選択します
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VIDEO_OPTIONS.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() =>
                  onConfigChange((prev) => ({
                    ...prev,
                    breakingNewsVideoId: video.id,
                  }))
                }
                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                  config.breakingNewsVideoId === video.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <video
                    src={video.src}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    onMouseEnter={(e) => {
                      const v = e.currentTarget;
                      v.currentTime = 0;
                      v.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                </div>
                <div className="p-2 text-center">
                  <span
                    className={`text-xs font-medium ${
                      config.breakingNewsVideoId === video.id
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {video.label}
                  </span>
                </div>
                {config.breakingNewsVideoId === video.id && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
