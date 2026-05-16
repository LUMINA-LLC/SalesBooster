'use client';

import { PeriodUnit, ViewType } from '@/types';
import { DateRange } from '../FilterBar';
import {
  usePeriodNavigation,
  PeriodSelection,
} from '@/hooks/usePeriodNavigation';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
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
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['単月', '期間'] as const).map((type) => (
              <Button
                key={type}
                label={type}
                variant="ghost"
                color="indigo"
                size="sm"
                isActive={periodType === type}
                onClick={() => setPeriodType(type)}
              />
            ))}
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
            value={
              selectedDate
                ? formatMonthLabel(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1,
                  )
                : ''
            }
            onChange={handleDateChange}
            options={monthOptions.map((label) => ({ value: label, label }))}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* 前へボタン */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="前へ"
        onClick={goToPrevious}
        disabled={!canGoPrevious()}
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        }
      />

      {/* 今月/今週/今日ボタン */}
      <Button
        label={currentLabel}
        variant="ghost"
        size="sm"
        onClick={goToCurrent}
      />

      {/* 次へボタン */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="次へ"
        onClick={goToNext}
        disabled={!canGoNext()}
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        }
      />

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
