import { DisplayViewConfig, PeriodMode, PeriodUnit } from '@/types/display';
import { ViewType } from '@/types';

/** 期間（ISO 文字列） */
export interface ResolvedPeriod {
  startDate: string;
  endDate: string;
}

/**
 * ビューの期間設定に対応する機能フラグ。
 * 新しいビューで期間設定を有効にする場合はここに追加する。
 */
export interface ViewPeriodCapability {
  /** periodUnit（月/週/日） + periodDateMode（CURRENT/FIXED）を使うか */
  unitMode: boolean;
  /** periodMode（YTD/LAST_3M...CUSTOM）を使うか */
  presetMode: boolean;
}

export const VIEW_PERIOD_CAPABILITIES: Partial<
  Record<ViewType, ViewPeriodCapability>
> = {
  PERIOD_GRAPH: { unitMode: true, presetMode: false },
  CUMULATIVE_GRAPH: { unitMode: false, presetMode: true },
  // 将来的に他ビューへ期間設定を広げる場合はここに追加
  // TREND_GRAPH: { unitMode: false, presetMode: true },
  // REPORT: { unitMode: false, presetMode: true },
};

/** 今月の期間（デフォルト用） */
export function getCurrentMonthPeriod(): ResolvedPeriod {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** periodUnit ベースで期間を計算（月/週/日 × 現在/固定） */
export function resolvePeriodByUnit(
  unit: PeriodUnit,
  base: Date,
): ResolvedPeriod {
  if (unit === '月') {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(
      base.getFullYear(),
      base.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (unit === '週') {
    // 月曜始まり
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + diffToMonday,
    );
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 6,
      23,
      59,
      59,
    );
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  // 日
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    23,
    59,
    59,
  );
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** periodMode ベースで期間を計算（YTD/LAST_3M/...） */
export function resolvePeriodByPreset(
  mode: PeriodMode | null | undefined,
  view?: DisplayViewConfig,
): ResolvedPeriod {
  const now = new Date();
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  switch (mode) {
    case 'LAST_3M': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
    case 'LAST_6M': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
    case 'FISCAL_YEAR': {
      const fiscalStart =
        now.getMonth() >= 3
          ? new Date(now.getFullYear(), 3, 1)
          : new Date(now.getFullYear() - 1, 3, 1);
      return {
        startDate: fiscalStart.toISOString(),
        endDate: endDate.toISOString(),
      };
    }
    case 'CUSTOM': {
      let startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      let endStr = endDate.toISOString();
      if (view?.periodStartMonth) {
        startDate = new Date(`${view.periodStartMonth}-01`).toISOString();
      }
      if (view?.periodEndMonth) {
        const [y, m] = view.periodEndMonth.split('-').map(Number);
        endStr = new Date(y, m, 0, 23, 59, 59).toISOString();
      }
      return { startDate, endDate: endStr };
    }
    case 'YTD':
    default: {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
  }
}

/**
 * ビューの設定から期間を解決する統一関数。
 * ビュータイプの capability に応じて適切な計算方式を選ぶ。
 */
export function resolveViewPeriod(view?: DisplayViewConfig): ResolvedPeriod {
  if (!view) return getCurrentMonthPeriod();
  const cap = VIEW_PERIOD_CAPABILITIES[view.viewType];

  // unitMode 優先（期間グラフ系）
  if (cap?.unitMode) {
    const unit = view.periodUnit ?? '月';
    const dateMode = view.periodDateMode ?? 'CURRENT';
    let base = new Date();
    if (dateMode === 'FIXED' && view.fixedPeriodDate) {
      const d = new Date(view.fixedPeriodDate);
      if (!isNaN(d.getTime())) base = d;
    }
    return resolvePeriodByUnit(unit, base);
  }

  // presetMode（累計グラフ系）
  if (cap?.presetMode) {
    return resolvePeriodByPreset(view.periodMode ?? null, view);
  }

  // 未対応ビューは当月
  return getCurrentMonthPeriod();
}
