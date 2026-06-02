'use client';

import { useState } from 'react';
import {
  DisplayConfig,
  DisplayViewConfig,
  CustomSlideData,
  ADDABLE_VIEW_TYPES,
} from '@/types/display';
import { ViewType, VIEW_TYPE_LABELS } from '@/types';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import ViewRow from './views/ViewRow';
import ViewCard from './views/ViewCard';

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

interface ViewSettingsSectionProps {
  config: DisplayConfig;
  customSlides: CustomSlideData[];
  deletingSlideId: number | null;
  dataTypes: DataTypeOption[];
  onUpdateView: (index: number, updates: Partial<DisplayViewConfig>) => void;
  onMoveView: (index: number, direction: 'up' | 'down') => void;
  onDeleteSlide: (slideId: number) => void;
  onEditSlide: (slideId: number) => void;
  onAddSlide: () => void;
  onAddView: (viewType: ViewType) => void;
  onRemoveView: (index: number) => void;
}

export default function ViewSettingsSection({
  config,
  customSlides,
  deletingSlideId,
  dataTypes,
  onUpdateView,
  onMoveView,
  onDeleteSlide,
  onEditSlide,
  onAddSlide,
  onAddView,
  onRemoveView,
}: ViewSettingsSectionProps) {
  const [addType, setAddType] = useState<ViewType>(ADDABLE_VIEW_TYPES[0]);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="font-semibold text-gray-800 mb-4">表示ビュー設定</h3>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">
                順番
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                ビュー名
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                表示タイトル
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">
                有効
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">
                表示秒数
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-28">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {config.views.map((view, index) => (
              <ViewRow
                key={`${view.viewType}-${view.customSlideId ?? index}`}
                view={view}
                index={index}
                totalCount={config.views.length}
                customSlides={customSlides}
                dataTypes={dataTypes}
                deletingSlideId={deletingSlideId}
                onUpdateView={onUpdateView}
                onMoveView={onMoveView}
                onDeleteSlide={onDeleteSlide}
                onEditSlide={onEditSlide}
                onRemoveView={onRemoveView}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル: カードリスト表示 */}
      <div className="md:hidden space-y-3">
        {config.views.map((view, index) => (
          <ViewCard
            key={`${view.viewType}-${view.customSlideId ?? index}`}
            view={view}
            index={index}
            totalCount={config.views.length}
            customSlides={customSlides}
            dataTypes={dataTypes}
            deletingSlideId={deletingSlideId}
            onUpdateView={onUpdateView}
            onMoveView={onMoveView}
            onDeleteSlide={onDeleteSlide}
            onEditSlide={onEditSlide}
            onRemoveView={onRemoveView}
          />
        ))}
      </div>

      {/* ビュー追加（グラフ系）: 種類を選んで追加 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select
          value={addType}
          onChange={(v) => setAddType(v as ViewType)}
          options={ADDABLE_VIEW_TYPES.map((vt) => ({
            value: vt,
            label: VIEW_TYPE_LABELS[vt],
          }))}
        />
        <Button
          label="ビューを追加"
          onClick={() => onAddView(addType)}
          variant="outline"
          icon={
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        期間グラフ・累計グラフ・推移グラフ・レポート・記録・数字ドンを複数追加できます
      </p>

      {/* スライド追加ボタン */}
      <div className="mt-4">
        <Button
          label="カスタムスライドを追加"
          onClick={onAddSlide}
          disabled={customSlides.length >= 10}
          title={
            customSlides.length >= 10 ? '上限の10件に達しています' : undefined
          }
          variant="outline"
          icon={
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        />
        <p className="text-xs text-gray-400 mt-1.5">
          画像・YouTube動画・テキストをローテーションに追加（最大10件）
        </p>
      </div>
    </div>
  );
}
