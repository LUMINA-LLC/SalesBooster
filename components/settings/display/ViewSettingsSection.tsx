'use client';

import { DisplayConfig, DisplayViewConfig, CustomSlideData, PERIOD_MODES, PERIOD_MODE_LABELS, PeriodMode } from '@/types/display';
import { VIEW_TYPE_LABELS, NumberBoardMetric, NUMBER_BOARD_METRIC_LABELS } from '@/types';
import Button from '@/components/common/Button';

const ALL_METRICS: NumberBoardMetric[] = ['TOTAL_SALES', 'TOTAL_COUNT', 'AVG_ACHIEVEMENT', 'TEAM_TARGET'];

const SLIDE_TYPE_LABELS: Record<string, string> = {
  IMAGE: '画像',
  YOUTUBE: 'YouTube',
  TEXT: 'テキスト',
};

interface ViewSettingsSectionProps {
  config: DisplayConfig;
  customSlides: CustomSlideData[];
  deletingSlideId: number | null;
  onUpdateView: (index: number, updates: Partial<DisplayViewConfig>) => void;
  onMoveView: (index: number, direction: 'up' | 'down') => void;
  onDeleteSlide: (slideId: number) => void;
  onAddSlide: () => void;
}

export default function ViewSettingsSection({
  config,
  customSlides,
  deletingSlideId,
  onUpdateView,
  onMoveView,
  onDeleteSlide,
  onAddSlide,
}: ViewSettingsSectionProps) {
  const isYouTubeSlide = (view: DisplayViewConfig) =>
    view.viewType === 'CUSTOM_SLIDE'
    && customSlides.find((s) => s.id === view.customSlideId)?.slideType === 'YOUTUBE';

  const getViewLabel = (view: DisplayViewConfig) =>
    view.viewType === 'CUSTOM_SLIDE'
      ? `カスタムスライド (${SLIDE_TYPE_LABELS[customSlides.find((s) => s.id === view.customSlideId)?.slideType ?? ''] || ''})`
      : VIEW_TYPE_LABELS[view.viewType];

  const toggleMetric = (index: number, metric: NumberBoardMetric) => {
    const view = config.views[index];
    const current = view.numberBoardMetrics ?? ['TOTAL_SALES', 'TOTAL_COUNT'];
    const next = current.includes(metric)
      ? current.filter((m) => m !== metric)
      : [...current, metric];
    if (next.length === 0) return; // 最低1つは必要
    onUpdateView(index, { numberBoardMetrics: next });
  };

  const renderPeriodSelector = (view: DisplayViewConfig, index: number) => {
    if (view.viewType !== 'CUMULATIVE_GRAPH') return null;
    const mode = view.periodMode ?? 'YTD';
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <span className="text-xs text-gray-500">期間:</span>
        <select
          value={mode}
          onChange={(e) => {
            const next = e.target.value as PeriodMode;
            onUpdateView(index, {
              periodMode: next,
              ...(next !== 'CUSTOM' ? { periodStartMonth: null, periodEndMonth: null } : {}),
            });
          }}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
        >
          {PERIOD_MODES.map((m) => (
            <option key={m} value={m}>{PERIOD_MODE_LABELS[m]}</option>
          ))}
        </select>
        {mode === 'CUSTOM' && (
          <>
            <input
              type="month"
              value={view.periodStartMonth ?? ''}
              onChange={(e) => onUpdateView(index, { periodStartMonth: e.target.value || null })}
              className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
            />
            <span className="text-xs text-gray-400">〜</span>
            <input
              type="month"
              value={view.periodEndMonth ?? ''}
              onChange={(e) => onUpdateView(index, { periodEndMonth: e.target.value || null })}
              className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
            />
          </>
        )}
      </div>
    );
  };

  const renderMetricSelector = (view: DisplayViewConfig, index: number) => {
    if (view.viewType !== 'NUMBER_BOARD') return null;
    const selected = view.numberBoardMetrics ?? ['TOTAL_SALES', 'TOTAL_COUNT'];
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {ALL_METRICS.map((metric) => (
          <label key={metric} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(metric)}
              onChange={() => toggleMetric(index, metric)}
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span className="text-xs text-gray-600">{NUMBER_BOARD_METRIC_LABELS[metric]}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">表示ビュー設定</h3>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">順番</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-44">ビュー名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">表示タイトル</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">有効</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">表示秒数</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            {config.views.map((view, index) => (
              <tr key={`${view.viewType}-${view.customSlideId ?? index}`} className="border-t border-gray-200">
                <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{getViewLabel(view)}</td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={view.title}
                    onChange={(e) => onUpdateView(index, { title: e.target.value })}
                    placeholder={VIEW_TYPE_LABELS[view.viewType]}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  {renderPeriodSelector(view, index)}
                  {renderMetricSelector(view, index)}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={view.enabled}
                    onChange={(e) => onUpdateView(index, { enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {isYouTubeSlide(view) ? (
                    <span className="text-sm text-gray-400">動画終了まで</span>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="number"
                        value={view.duration}
                        onChange={(e) => onUpdateView(index, { duration: Math.max(5, parseInt(e.target.value) || 5) })}
                        min={5}
                        max={600}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      />
                      <span className="text-gray-500">秒</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => onMoveView(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onMoveView(index, 'down')}
                      disabled={index === config.views.length - 1}
                      className={`p-1 rounded ${index === config.views.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {view.viewType === 'CUSTOM_SLIDE' && (
                      <button
                        onClick={() => view.customSlideId && onDeleteSlide(view.customSlideId)}
                        disabled={deletingSlideId === view.customSlideId}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="スライドを削除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル: カードリスト表示 */}
      <div className="md:hidden space-y-3">
        {config.views.map((view, index) => (
          <div key={`${view.viewType}-${view.customSlideId ?? index}`} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
                <span className="text-sm font-medium text-gray-800">{getViewLabel(view)}</span>
              </div>
              <label className="flex items-center space-x-1.5">
                <span className="text-xs text-gray-500">有効</span>
                <input
                  type="checkbox"
                  checked={view.enabled}
                  onChange={(e) => onUpdateView(index, { enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
            <div className="mb-2">
              <input
                type="text"
                value={view.title}
                onChange={(e) => onUpdateView(index, { title: e.target.value })}
                placeholder={VIEW_TYPE_LABELS[view.viewType]}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
              {renderMetricSelector(view, index)}
            </div>
            <div className="flex items-center justify-between">
              {isYouTubeSlide(view) ? (
                <span className="text-xs text-gray-400">動画終了まで</span>
              ) : (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={view.duration}
                    onChange={(e) => onUpdateView(index, { duration: Math.max(5, parseInt(e.target.value) || 5) })}
                    min={5}
                    max={600}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                  />
                  <span className="text-xs text-gray-500">秒</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onMoveView(index, 'up')}
                  disabled={index === 0}
                  className={`p-1.5 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => onMoveView(index, 'down')}
                  disabled={index === config.views.length - 1}
                  className={`p-1.5 rounded ${index === config.views.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {view.viewType === 'CUSTOM_SLIDE' && (
                  <button
                    onClick={() => view.customSlideId && onDeleteSlide(view.customSlideId)}
                    disabled={deletingSlideId === view.customSlideId}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="スライドを削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* スライド追加ボタン */}
      <div className="mt-4">
        <Button
          label="カスタムスライドを追加"
          onClick={onAddSlide}
          disabled={customSlides.length >= 10}
          title={customSlides.length >= 10 ? '上限の10件に達しています' : undefined}
          variant="outline"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
        <p className="text-xs text-gray-400 mt-1.5">画像・YouTube動画・テキストをローテーションに追加（最大10件）</p>
      </div>
    </div>
  );
}
