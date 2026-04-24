'use client';

import {
  BreakingNewsConfig,
  DEFAULT_BREAKING_NEWS_MESSAGE,
  DEFAULT_BREAKING_NEWS_VIDEO_ID,
} from '@/types/display';
import { VIDEO_OPTIONS } from './types';

interface BreakingNewsFormProps {
  /** デフォルトタブ(データ種別 0〜1件時のみ表示)か */
  isDefaultTab: boolean;
  /** データ種別複数時は「デフォルトに従う」カードを隠す */
  hideDefaultFallback: boolean;
  /** 個別タブ時のデータ種別ID (デフォルトタブ時はnull) */
  activeDataTypeId: number | null;
  /** 個別タブ時のみ参照される現在の設定 */
  perConfig: BreakingNewsConfig | undefined;
  updatePerConfig: (
    dataTypeId: number,
    patch: Partial<BreakingNewsConfig>,
  ) => void;
}

export default function BreakingNewsForm({
  isDefaultTab,
  hideDefaultFallback,
  activeDataTypeId,
  perConfig,
  updatePerConfig,
}: BreakingNewsFormProps) {
  const currentEnabled = isDefaultTab ? true : (perConfig?.enabled ?? true);
  const currentMessage = isDefaultTab
    ? DEFAULT_BREAKING_NEWS_MESSAGE
    : (perConfig?.message ?? null);
  const currentVideoId = isDefaultTab
    ? DEFAULT_BREAKING_NEWS_VIDEO_ID
    : (perConfig?.videoId ?? null);
  const displayVideoId = currentVideoId ?? DEFAULT_BREAKING_NEWS_VIDEO_ID;

  return (
    <div className="space-y-4">
      {/* 個別タブでは表示可否の切替 */}
      {!isDefaultTab && activeDataTypeId !== null && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentEnabled}
              onChange={(e) =>
                updatePerConfig(activeDataTypeId, {
                  enabled: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              このデータ種別で速報を表示する
            </span>
          </label>
        </div>
      )}

      {/* 速報メッセージ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-gray-700">
            速報メッセージ
          </div>
          <div className="text-xs text-gray-500">
            {isDefaultTab
              ? '速報表示時にメンバー名の下に表示するメッセージ'
              : '空欄時はデフォルト設定を使用'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={
              isDefaultTab
                ? DEFAULT_BREAKING_NEWS_MESSAGE
                : (currentMessage ?? '')
            }
            onChange={(e) => {
              if (isDefaultTab) return; // デフォルトタブは定数のため編集不可
              if (activeDataTypeId !== null) {
                updatePerConfig(activeDataTypeId, {
                  message: e.target.value === '' ? null : e.target.value,
                });
              }
            }}
            disabled={isDefaultTab || !currentEnabled}
            placeholder={
              isDefaultTab
                ? DEFAULT_BREAKING_NEWS_MESSAGE
                : `デフォルト: ${DEFAULT_BREAKING_NEWS_MESSAGE}`
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[200px] disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
      </div>

      {/* 動画選択 */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-1">
          速報エフェクト
        </div>
        <div className="text-xs text-gray-500 mb-3">
          {isDefaultTab
            ? '売上データ登録時に再生される速報動画を選択します'
            : '未選択時はデフォルト設定を使用'}
        </div>
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${
            !isDefaultTab && !currentEnabled
              ? 'opacity-50 pointer-events-none'
              : ''
          }`}
        >
          {!isDefaultTab && !hideDefaultFallback && (
            <button
              type="button"
              onClick={() => {
                if (activeDataTypeId !== null) {
                  updatePerConfig(activeDataTypeId, { videoId: null });
                }
              }}
              className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                currentVideoId === null
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-500">デフォルトに従う</span>
              </div>
              <div className="p-2 text-center">
                <span
                  className={`text-xs font-medium ${
                    currentVideoId === null ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  デフォルト
                </span>
              </div>
              {currentVideoId === null && (
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
          )}
          {VIDEO_OPTIONS.map((video) => {
            const isSelected = displayVideoId === video.id;
            const isExplicitlySelected = isDefaultTab
              ? DEFAULT_BREAKING_NEWS_VIDEO_ID === video.id
              : currentVideoId === video.id;
            return (
              <button
                key={video.id}
                type="button"
                disabled={isDefaultTab}
                onClick={() => {
                  if (isDefaultTab) return; // デフォルトタブは定数のため編集不可
                  if (activeDataTypeId !== null) {
                    updatePerConfig(activeDataTypeId, { videoId: video.id });
                  }
                }}
                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                  isExplicitlySelected
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
                      isExplicitlySelected ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {video.label}
                    {!isDefaultTab && isSelected && !isExplicitlySelected && (
                      <span className="text-gray-400 ml-1">(デフォルト)</span>
                    )}
                  </span>
                </div>
                {isExplicitlySelected && (
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
