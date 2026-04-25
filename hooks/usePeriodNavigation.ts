import { useState, useEffect, useMemo, useCallback } from 'react';
import { PeriodUnit, ViewType } from '@/types';
import { DateRange } from '@/components/FilterBar';
import type { DefaultViewSettings } from '@/types/graph';

export interface PeriodSelection {
  startDate: string; // ISO string
  endDate: string; // ISO string
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${String(month).padStart(2, '0')}月`;
}

/** "YYYY-MM" → "YYYY年MM月" */
function formatMonthLabelFromYM(ym: string): string {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return '';
  return formatMonthLabel(parseInt(m[1]), parseInt(m[2]));
}

/** "YYYY-MM" → Date(初日) */
function parseYM(ym: string): Date | null {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return new Date(parseInt(m[1]), parseInt(m[2]) - 1, 1);
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
  /** true の時は「期間選択のみ」のモード(単月UIは出ない) */
  forcePeriodOnly?: boolean;
  dateRange: DateRange | null;
  onPeriodChange?: (period: PeriodSelection) => void;
  /** 現在表示中のビュー */
  selectedView?: ViewType;
  /** ダッシュボード各グラフの初期値設定 */
  defaultViewSettings?: DefaultViewSettings;
}

export function usePeriodNavigation({
  periodUnit,
  showPeriodSelection,
  forcePeriodOnly = false,
  dateRange,
  onPeriodChange,
  selectedView,
  defaultViewSettings,
}: UsePeriodNavigationProps) {
  const [periodType, setPeriodType] = useState<'単月' | '期間'>(
    forcePeriodOnly ? '期間' : '単月',
  );
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

  // forcePeriodOnly 切替時は periodType を強制的に '期間' に
  useEffect(() => {
    if (forcePeriodOnly) setPeriodType('期間');
  }, [forcePeriodOnly]);

  // dateRangeが読み込まれたら初期選択を最大日に設定
  // forcePeriodOnly 時は「1年前 〜 最新月」をデフォルトに
  // selectedView × defaultViewSettings に保存値があれば優先する
  useEffect(() => {
    if (!maxDate) return;

    const endLabel = formatMonthLabel(
      maxDate.getFullYear(),
      maxDate.getMonth() + 1,
    );

    // 保存済み初期値の解釈
    if (selectedView && defaultViewSettings) {
      const view =
        defaultViewSettings[selectedView as keyof DefaultViewSettings];
      if (view) {
        if (selectedView === 'PERIOD_GRAPH' && 'dateLabel' in view) {
          // 期間グラフ: dateLabel をそのまま selectedDate として解釈
          const parsed = parseDateLabel(view.dateLabel, periodUnit);
          if (parsed) {
            setSelectedDate(parsed);
            return;
          }
        }
        if (
          (selectedView === 'CUMULATIVE_GRAPH' ||
            selectedView === 'TREND_GRAPH') &&
          'mode' in view
        ) {
          if (view.mode === '期間' && view.startMonth && view.endMonth) {
            setPeriodType('期間');
            setStartMonth(formatMonthLabelFromYM(view.startMonth));
            setEndMonth(formatMonthLabelFromYM(view.endMonth));
            return;
          }
          if (view.mode === '単月' && view.month) {
            setPeriodType('単月');
            const d = parseYM(view.month);
            if (d) setSelectedDate(d);
            return;
          }
        }
        if (selectedView === 'REPORT' && 'month' in view && view.month) {
          const d = parseYM(view.month);
          if (d) setSelectedDate(d);
          return;
        }
        if (selectedView === 'RECORD' && 'startMonth' in view) {
          if (view.startMonth && view.endMonth) {
            setStartMonth(formatMonthLabelFromYM(view.startMonth));
            setEndMonth(formatMonthLabelFromYM(view.endMonth));
            return;
          }
        }
      }
    }

    // フォールバック: 既存の「最大日」or「forcePeriodOnly時1年」ロジック
    setSelectedDate(new Date(maxDate));
    if (forcePeriodOnly) {
      const start = new Date(maxDate.getFullYear(), maxDate.getMonth() - 11, 1);
      const clampedStart =
        minDate && start < minDate ? new Date(minDate) : start;
      const startLabel = formatMonthLabel(
        clampedStart.getFullYear(),
        clampedStart.getMonth() + 1,
      );
      setStartMonth(startLabel);
      setEndMonth(endLabel);
    } else {
      setStartMonth(endLabel);
      setEndMonth(endLabel);
    }
  }, [
    maxDate,
    minDate,
    forcePeriodOnly,
    selectedView,
    defaultViewSettings,
    periodUnit,
  ]);

  // 選択期間が変わったら親に通知
  useEffect(() => {
    if (!onPeriodChange) return;

    if ((showPeriodSelection && periodType === '期間') || forcePeriodOnly) {
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

    // showPeriodSelection（累計/推移/レポート）で単月モード時は、
    // periodUnit に関わらず月単位で期間を計算する
    const effectiveUnit: PeriodUnit = showPeriodSelection ? '月' : periodUnit;
    const { start, end } = computePeriod(selectedDate, effectiveUnit);
    onPeriodChange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  }, [
    selectedDate,
    periodUnit,
    showPeriodSelection,
    forcePeriodOnly,
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
      // 累計/推移/レポートの単月選択時は月単位で parse（periodUnit が週/日でも月形式）
      const effectiveUnit: PeriodUnit = showPeriodSelection ? '月' : periodUnit;
      const parsed = parseDateLabel(value, effectiveUnit);
      if (parsed) setSelectedDate(parsed);
    },
    [periodUnit, showPeriodSelection],
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
