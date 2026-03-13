import { useState, useEffect, useMemo, useCallback } from 'react';
import { PeriodUnit } from '@/types';
import { DateRange } from '@/components/FilterBar';

export interface PeriodSelection {
  startDate: string; // ISO string
  endDate: string; // ISO string
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${String(month).padStart(2, '0')}月`;
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** selectedDate + periodUnit から期間の開始・終了を算出 */
function computePeriod(
  selectedDate: Date,
  periodUnit: PeriodUnit,
): { start: Date; end: Date } {
  switch (periodUnit) {
    case '月':
      return {
        start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        end: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
        ),
      };
    case '週': {
      const monday = getWeekMonday(selectedDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case '日':
      return {
        start: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        ),
        end: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59,
        ),
      };
  }
}

/** 期間表示用の文字列を生成 */
function formatDateLabel(selectedDate: Date, periodUnit: PeriodUnit): string {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();

  switch (periodUnit) {
    case '月':
      return formatMonthLabel(year, month);
    case '週': {
      const monday = getWeekMonday(selectedDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const startStr = `${monday.getMonth() + 1}/${monday.getDate()}`;
      const endStr = `${sunday.getMonth() + 1}/${sunday.getDate()}`;
      return `${year}年 ${startStr}〜${endStr}`;
    }
    case '日':
      return `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`;
  }
}

/** 表示文字列 → Date への逆変換 */
function parseDateLabel(value: string, periodUnit: PeriodUnit): Date | null {
  switch (periodUnit) {
    case '月': {
      const match = value.match(/(\d+)年(\d+)月/);
      return match
        ? new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1)
        : null;
    }
    case '週': {
      const match = value.match(/(\d+)年\s*(\d+)\/(\d+)/);
      return match
        ? new Date(
            parseInt(match[1]),
            parseInt(match[2]) - 1,
            parseInt(match[3]),
          )
        : null;
    }
    case '日': {
      const match = value.match(/(\d+)年(\d+)月(\d+)日/);
      return match
        ? new Date(
            parseInt(match[1]),
            parseInt(match[2]) - 1,
            parseInt(match[3]),
          )
        : null;
    }
  }
}

/** ドロップダウン用の選択肢を生成 */
function generateDateOptions(
  minDate: Date,
  maxDate: Date,
  periodUnit: PeriodUnit,
): string[] {
  const options: string[] = [];
  switch (periodUnit) {
    case '月': {
      const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      while (cursor <= end) {
        options.push(
          formatMonthLabel(cursor.getFullYear(), cursor.getMonth() + 1),
        );
        cursor.setMonth(cursor.getMonth() + 1);
      }
      break;
    }
    case '週': {
      const cursor = getWeekMonday(minDate);
      while (cursor <= maxDate) {
        const monday = new Date(cursor);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const year = monday.getFullYear();
        const startStr = `${monday.getMonth() + 1}/${monday.getDate()}`;
        const endStr = `${sunday.getMonth() + 1}/${sunday.getDate()}`;
        options.push(`${year}年 ${startStr}〜${endStr}`);
        cursor.setDate(cursor.getDate() + 7);
      }
      break;
    }
    case '日': {
      const cursor = new Date(minDate);
      while (cursor <= maxDate) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const day = cursor.getDate();
        options.push(
          `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`,
        );
        cursor.setDate(cursor.getDate() + 1);
      }
      break;
    }
  }
  return options;
}

/** 月選択用のオプションを生成 */
function generateMonthOptions(
  minDate: Date | null,
  maxDate: Date | null,
): string[] {
  if (!minDate || !maxDate) return [];
  const options: string[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (cursor <= end) {
    options.push(formatMonthLabel(cursor.getFullYear(), cursor.getMonth() + 1));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return options;
}

interface UsePeriodNavigationProps {
  periodUnit: PeriodUnit;
  showPeriodSelection: boolean;
  dateRange: DateRange | null;
  onPeriodChange?: (period: PeriodSelection) => void;
}

export function usePeriodNavigation({
  periodUnit,
  showPeriodSelection,
  dateRange,
  onPeriodChange,
}: UsePeriodNavigationProps) {
  const [periodType, setPeriodType] = useState<'単月' | '期間'>('単月');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const minDate = useMemo(
    () => (dateRange ? new Date(dateRange.minDate) : null),
    [dateRange],
  );
  const maxDate = useMemo(
    () => (dateRange ? new Date(dateRange.maxDate) : null),
    [dateRange],
  );

  // dateRangeが読み込まれたら初期選択を最大日に設定
  useEffect(() => {
    if (maxDate) {
      setSelectedDate(new Date(maxDate));
      const label = formatMonthLabel(
        maxDate.getFullYear(),
        maxDate.getMonth() + 1,
      );
      setStartMonth(label);
      setEndMonth(label);
    }
  }, [maxDate]);

  // 選択期間が変わったら親に通知
  useEffect(() => {
    if (!onPeriodChange) return;

    if (showPeriodSelection && periodType === '期間') {
      const startMatch = startMonth.match(/(\d+)年(\d+)月/);
      const endMatch = endMonth.match(/(\d+)年(\d+)月/);
      if (startMatch && endMatch) {
        const s = new Date(
          parseInt(startMatch[1]),
          parseInt(startMatch[2]) - 1,
          1,
        );
        const e = new Date(
          parseInt(endMatch[1]),
          parseInt(endMatch[2]),
          0,
          23,
          59,
          59,
        );
        onPeriodChange({
          startDate: s.toISOString(),
          endDate: e.toISOString(),
        });
      }
      return;
    }

    const { start, end } = computePeriod(selectedDate, periodUnit);
    onPeriodChange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  }, [
    selectedDate,
    periodUnit,
    showPeriodSelection,
    periodType,
    startMonth,
    endMonth,
    onPeriodChange,
  ]);

  const canGoPrevious = useCallback((): boolean => {
    if (!minDate) return true;
    switch (periodUnit) {
      case '月':
        return (
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0) >=
          minDate
        );
      case '週': {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 7);
        return d >= minDate;
      }
      case '日': {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        return d >= minDate;
      }
    }
  }, [selectedDate, periodUnit, minDate]);

  const canGoNext = useCallback((): boolean => {
    if (!maxDate) return true;
    switch (periodUnit) {
      case '月':
        return (
          new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            1,
          ) <= maxDate
        );
      case '週': {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 7);
        return d <= maxDate;
      }
      case '日': {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        return d <= maxDate;
      }
    }
  }, [selectedDate, periodUnit, maxDate]);

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious()) return;
    const d = new Date(selectedDate);
    switch (periodUnit) {
      case '月':
        d.setMonth(d.getMonth() - 1);
        break;
      case '週':
        d.setDate(d.getDate() - 7);
        break;
      case '日':
        d.setDate(d.getDate() - 1);
        break;
    }
    setSelectedDate(d);
  }, [selectedDate, periodUnit, canGoPrevious]);

  const goToNext = useCallback(() => {
    if (!canGoNext()) return;
    const d = new Date(selectedDate);
    switch (periodUnit) {
      case '月':
        d.setMonth(d.getMonth() + 1);
        break;
      case '週':
        d.setDate(d.getDate() + 7);
        break;
      case '日':
        d.setDate(d.getDate() + 1);
        break;
    }
    setSelectedDate(d);
  }, [selectedDate, periodUnit, canGoNext]);

  const goToCurrent = useCallback(() => {
    const today = new Date();
    if (maxDate && today > maxDate) setSelectedDate(new Date(maxDate));
    else if (minDate && today < minDate) setSelectedDate(new Date(minDate));
    else setSelectedDate(today);
  }, [minDate, maxDate]);

  const currentLabel =
    periodUnit === '月' ? '今月' : periodUnit === '週' ? '今週' : '今日';
  const currentDateStr = formatDateLabel(selectedDate, periodUnit);
  const dateOptions =
    minDate && maxDate ? generateDateOptions(minDate, maxDate, periodUnit) : [];
  const monthOptions = generateMonthOptions(minDate, maxDate);

  const handleDateChange = useCallback(
    (value: string) => {
      const parsed = parseDateLabel(value, periodUnit);
      if (parsed) setSelectedDate(parsed);
    },
    [periodUnit],
  );

  return {
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
  };
}
