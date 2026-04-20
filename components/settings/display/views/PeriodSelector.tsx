'use client';

import { useEffect, useState } from 'react';
import {
  DisplayViewConfig,
  PERIOD_MODES,
  PERIOD_MODE_LABELS,
  PeriodMode,
  PeriodUnit,
} from '@/types/display';
import { VIEW_PERIOD_CAPABILITIES } from '@/lib/displayPeriod';

interface PeriodSelectorProps {
  view: DisplayViewConfig;
  onUpdate: (updates: Partial<DisplayViewConfig>) => void;
}

/** プリセット期間設定（YTD/LAST_3M/CUSTOM...） */
function PresetPeriodSelector({ view, onUpdate }: PeriodSelectorProps) {
  const mode = view.periodMode ?? 'YTD';
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <span className="text-xs text-gray-500">期間:</span>
      <select
        value={mode}
        onChange={(e) => {
          const next = e.target.value as PeriodMode;
          onUpdate({
            periodMode: next,
            ...(next !== 'CUSTOM'
              ? { periodStartMonth: null, periodEndMonth: null }
              : {}),
          });
        }}
        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
      >
        {PERIOD_MODES.map((m) => (
          <option key={m} value={m}>
            {PERIOD_MODE_LABELS[m]}
          </option>
        ))}
      </select>
      {mode === 'CUSTOM' && (
        <>
          <input
            type="month"
            value={view.periodStartMonth ?? ''}
            onChange={(e) =>
              onUpdate({ periodStartMonth: e.target.value || null })
            }
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          />
          <span className="text-xs text-gray-400">〜</span>
          <input
            type="month"
            value={view.periodEndMonth ?? ''}
            onChange={(e) =>
              onUpdate({ periodEndMonth: e.target.value || null })
            }
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          />
        </>
      )}
    </div>
  );
}

// --- 固定指定用ドロップダウン選択肢生成 ---

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Dateを YYYY-MM-DD 形式に */
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** その日を含む週の月曜日を返す */
function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return monday;
}

interface Option {
  value: string; // YYYY-MM-DD（保存値）
  label: string; // 表示ラベル
}

/** 月: min〜max の間の YYYY-MM-01 のリスト */
function generateMonthOptions(minDate: Date, maxDate: Date): Option[] {
  const options: Option[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (cursor <= end) {
    options.push({
      value: toYMD(cursor),
      label: `${cursor.getFullYear()}年${pad2(cursor.getMonth() + 1)}月`,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return options;
}

/** 週: 月曜日を YYYY-MM-DD で保存、ラベルは「YYYY年 M/D〜M/D」 */
function generateWeekOptions(minDate: Date, maxDate: Date): Option[] {
  const options: Option[] = [];
  const cursor = getWeekMonday(minDate);
  while (cursor <= maxDate) {
    const monday = new Date(cursor);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    options.push({
      value: toYMD(monday),
      label: `${monday.getFullYear()}年 ${monday.getMonth() + 1}/${monday.getDate()}〜${sunday.getMonth() + 1}/${sunday.getDate()}`,
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return options;
}

/** 日: min〜max の間の各日を YYYY-MM-DD で */
function generateDayOptions(minDate: Date, maxDate: Date): Option[] {
  const options: Option[] = [];
  const cursor = new Date(
    minDate.getFullYear(),
    minDate.getMonth(),
    minDate.getDate(),
  );
  const end = new Date(
    maxDate.getFullYear(),
    maxDate.getMonth(),
    maxDate.getDate(),
  );
  while (cursor <= end) {
    options.push({
      value: toYMD(cursor),
      label: `${cursor.getFullYear()}年${pad2(cursor.getMonth() + 1)}月${pad2(cursor.getDate())}日`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return options;
}

function generateOptions(
  unit: PeriodUnit,
  minDate: Date | null,
  maxDate: Date | null,
): Option[] {
  if (!minDate || !maxDate) return [];
  if (unit === '月') return generateMonthOptions(minDate, maxDate);
  if (unit === '週') return generateWeekOptions(minDate, maxDate);
  return generateDayOptions(minDate, maxDate);
}

/** 単位モード期間設定（月/週/日 + 現在/固定） */
function UnitPeriodSelector({ view, onUpdate }: PeriodSelectorProps) {
  const unit = view.periodUnit ?? '月';
  const dateMode = view.periodDateMode ?? 'CURRENT';
  const fixedDate = view.fixedPeriodDate ?? '';

  // データが存在する期間を取得（ダッシュボードと同様）
  const [minDate, setMinDate] = useState<Date | null>(null);
  const [maxDate, setMaxDate] = useState<Date | null>(null);
  useEffect(() => {
    fetch('/api/sales/date-range')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { minDate: string; maxDate: string } | null) => {
        if (data?.minDate && data?.maxDate) {
          setMinDate(new Date(data.minDate));
          setMaxDate(new Date(data.maxDate));
        }
      })
      .catch(() => {});
  }, []);

  // 単位と範囲に応じて選択肢を生成
  const options = generateOptions(unit, minDate, maxDate);

  // 保存値を選択可能な値に正規化（週: 月曜日に寄せる）
  const normalizeValue = (v: string): string => {
    if (!v) return '';
    if (unit === '週') {
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      return toYMD(getWeekMonday(d));
    }
    return v;
  };

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">単位:</span>
        {(['月', '週', '日'] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => onUpdate({ periodUnit: u, fixedPeriodDate: null })}
            className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors ${
              unit === u
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            {u}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">表示対象:</span>
        <label className="flex items-center gap-1 text-xs text-gray-700">
          <input
            type="radio"
            checked={dateMode === 'CURRENT'}
            onChange={() =>
              onUpdate({
                periodDateMode: 'CURRENT',
                fixedPeriodDate: null,
              })
            }
          />
          現在（自動）
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-700">
          <input
            type="radio"
            checked={dateMode === 'FIXED'}
            onChange={() => onUpdate({ periodDateMode: 'FIXED' })}
          />
          固定指定
        </label>
        {dateMode === 'FIXED' &&
          (options.length === 0 ? (
            <span className="text-xs text-gray-400">データが存在しません</span>
          ) : (
            <select
              value={normalizeValue(fixedDate)}
              onChange={(e) =>
                onUpdate({ fixedPeriodDate: e.target.value || null })
              }
              className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
            >
              <option value="">選択してください</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
      </div>
    </div>
  );
}

/** ビュータイプの capability に応じて期間設定 UI を出し分け */
export default function PeriodSelector(props: PeriodSelectorProps) {
  const cap = VIEW_PERIOD_CAPABILITIES[props.view.viewType];
  if (!cap) return null;
  if (cap.unitMode) return <UnitPeriodSelector {...props} />;
  if (cap.presetMode) return <PresetPeriodSelector {...props} />;
  return null;
}
