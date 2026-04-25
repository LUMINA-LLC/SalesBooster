'use client';

import { DisplayViewConfig, CustomSlideData } from '@/types/display';
import { VIEW_TYPE_LABELS } from '@/types';
import SlideThumbnail from './SlideThumbnail';
import PeriodSelector from './PeriodSelector';
import DataTypeSelector from './DataTypeSelector';
import NumberBoardMetricSelector from './NumberBoardMetricSelector';

const SLIDE_TYPE_LABELS: Record<string, string> = {
  IMAGE: '画像',
  YOUTUBE: 'YouTube',
  TEXT: 'テキスト',
};

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

interface ViewRowProps {
  view: DisplayViewConfig;
  index: number;
  totalCount: number;
  customSlides: CustomSlideData[];
  dataTypes: DataTypeOption[];
  deletingSlideId: number | null;
  onUpdateView: (index: number, updates: Partial<DisplayViewConfig>) => void;
  onMoveView: (index: number, direction: 'up' | 'down') => void;
  onDeleteSlide: (slideId: number) => void;
  onEditSlide: (slideId: number) => void;
}

/** PC版テーブル1行分 */
export default function ViewRow({
  view,
  index,
  totalCount,
  customSlides,
  dataTypes,
  deletingSlideId,
  onUpdateView,
  onMoveView,
  onDeleteSlide,
  onEditSlide,
}: ViewRowProps) {
  const isYouTubeSlide =
    view.viewType === 'CUSTOM_SLIDE' &&
    customSlides.find((s) => s.id === view.customSlideId)?.slideType ===
      'YOUTUBE';

  const viewLabel =
    view.viewType === 'CUSTOM_SLIDE'
      ? `カスタムスライド (${SLIDE_TYPE_LABELS[customSlides.find((s) => s.id === view.customSlideId)?.slideType ?? ''] || ''})`
      : VIEW_TYPE_LABELS[view.viewType];

  const update = (updates: Partial<DisplayViewConfig>) =>
    onUpdateView(index, updates);

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {view.viewType === 'CUSTOM_SLIDE' && view.customSlideId ? (
            <button
              type="button"
              onClick={() => onEditSlide(view.customSlideId!)}
              className="rounded hover:ring-2 hover:ring-blue-300 transition-shadow"
              title="クリックしてスライドを編集"
            >
              <SlideThumbnail view={view} customSlides={customSlides} />
            </button>
          ) : (
            <SlideThumbnail view={view} customSlides={customSlides} />
          )}
          <span>{viewLabel}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={view.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder={VIEW_TYPE_LABELS[view.viewType]}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <PeriodSelector view={view} onUpdate={update} />
        <DataTypeSelector view={view} dataTypes={dataTypes} onUpdate={update} />
        <NumberBoardMetricSelector
          view={view}
          dataTypes={dataTypes}
          onUpdate={update}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={view.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded"
        />
      </td>
      <td className="px-4 py-3 text-center">
        {isYouTubeSlide ? (
          <span className="text-sm text-gray-400">動画終了まで</span>
        ) : (
          <div className="flex items-center justify-center space-x-1">
            <input
              type="number"
              value={view.duration}
              onChange={(e) =>
                update({
                  duration: Math.max(5, parseInt(e.target.value) || 5),
                })
              }
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
          <button
            onClick={() => onMoveView(index, 'down')}
            disabled={index === totalCount - 1}
            className={`p-1 rounded ${index === totalCount - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {view.viewType === 'CUSTOM_SLIDE' && (
            <>
              <button
                onClick={() =>
                  view.customSlideId && onEditSlide(view.customSlideId)
                }
                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="スライドを編集"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  view.customSlideId && onDeleteSlide(view.customSlideId)
                }
                disabled={deletingSlideId === view.customSlideId}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="スライドを削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
