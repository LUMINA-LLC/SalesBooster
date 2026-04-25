'use client';

import { PeriodUnit, ViewType } from '@/types';
import { DateRange } from '../FilterBar';
import {
  usePeriodNavigation,
  PeriodSelection,
} from '@/hooks/usePeriodNavigation';
import Select from '@/components/common/Select';
import type { DefaultViewSettings } from '@/types/graph';

export type { PeriodSelection };

interface PeriodNavigatorProps {
  periodUnit: PeriodUnit;
  showPeriodSelection: boolean;
  forcePeriodOnly?: boolean;
  dateRange: DateRange | null;
  onPeriodChange?: (period: PeriodSelection) => void;
  selectedView?: ViewType;
  defaultViewSettings?: DefaultViewSettings;
}

export default function PeriodNavigator({
  periodUnit,
  showPeriodSelection,
  forcePeriodOnly = false,
  dateRange,
  onPeriodChange,
  selectedView,
  defaultViewSettings,
}: PeriodNavigatorProps) {
  const {
    periodType,
    setPeriodType,
    startMonth,
    setStartMonth,
    endMonth,
    setEndMonth,
    selectedDate,
    canGoPrevious,
    canGoNext,
    goToPrevious,
    goToNext,
    goToCurrent,
    currentLabel,
    currentDateStr,
    dateOptions,
    monthOptions,
    handleDateChange,
    formatMonthLabel,
  } = usePeriodNavigation({
    periodUnit,
    showPeriodSelection,
    forcePeriodOnly,
    dateRange,
    onPeriodChange,
    selectedView,
    defaultViewSettings,
  });

  if (showPeriodSelection) {
    return (
      <div className="flex items-center space-x-2">
        {/* 期間タイプ選択 (forcePeriodOnly時は非表示) */}
        {!forcePeriodOnly && (
          <div className="flex items-center border border-gray-300 rounded bg-white">
            <button
              className={`px-3 py-1 text-sm ${periodType === '単月' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setPeriodType('単月')}
            >
              単月
            </button>
            <button
              className={`px-3 py-1 text-sm border-l border-gray-300 ${periodType === '期間' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setPeriodType('期間')}
            >
              期間
            </button>
          </div>
        )}

        {periodType === '期間' || forcePeriodOnly ? (
          <>
            <Select
              value={startMonth}
              onChange={setStartMonth}
              options={monthOptions.map((label) => ({ value: label, label }))}
            />
            <span className="text-sm text-gray-600">〜</span>
            <Select
              value={endMonth}
              onChange={setEndMonth}
              options={monthOptions.map((label) => ({ value: label, label }))}
            />
          </>
        ) : (
          <Select
            value={formatMonthLabel(
              selectedDate.getFullYear(),
              selectedDate.getMonth() + 1,
            )}
            onChange={handleDateChange}
            options={monthOptions.map((label) => ({ value: label, label }))}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* 前へボタン */}
      <button
        className={`p-1 rounded border border-gray-300 ${canGoPrevious() ? 'hover:bg-gray-200 bg-white' : 'bg-gray-100 cursor-not-allowed opacity-50'}`}
        onClick={goToPrevious}
        disabled={!canGoPrevious()}
        aria-label="前へ"
      >
        <svg
          className={`w-5 h-5 ${canGoPrevious() ? 'text-gray-600' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* 今月/今週/今日ボタン */}
      <button
        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-100"
        onClick={goToCurrent}
      >
        {currentLabel}
      </button>

      {/* 次へボタン */}
      <button
        className={`p-1 rounded border border-gray-300 ${canGoNext() ? 'hover:bg-gray-200 bg-white' : 'bg-gray-100 cursor-not-allowed opacity-50'}`}
        onClick={goToNext}
        disabled={!canGoNext()}
        aria-label="次へ"
      >
        <svg
          className={`w-5 h-5 ${canGoNext() ? 'text-gray-600' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* 日付選択ドロップダウン */}
      <Select
        value={currentDateStr}
        onChange={handleDateChange}
        options={dateOptions.map((option) => ({
          value: option,
          label: option,
        }))}
      />
    </div>
  );
}
