/**
 * 日付計算ヘルパー
 * salesController 等で繰り返し使われるデフォルト日付パターンを集約。
 */

/** JST 固定オフセット (ミリ秒) */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Date を JST として年/月/日を取り出す。
 *
 * フロント (JST 想定) から `new Date(year, month-1, 1).toISOString()` のように
 * 送られた値を、サーバプロセスのタイムゾーンに依存せず JST 起点で再解釈する。
 */
export function getJstYearMonth(date: Date): { year: number; month: number } {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    // getUTCMonth() は 0始まり → +1 して 1始まりに
    month: jst.getUTCMonth() + 1,
  };
}

/** 当月末日 23:59:59 */
export function endOfCurrentMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

/**
 * searchParams から startDate / endDate をパースし、
 * 指定がなければ endDate → 当月末、startDate → endDate から 12 ヶ月前の 1 日を返す。
 * getReportData / getTrendData 共通。
 */
export function parseTrailingTwelveMonthsRange(
  searchParams: URLSearchParams,
  now = new Date(),
): { startDate: Date; endDate: Date } {
  const endDateParam = searchParams.get('endDate');
  const startDateParam = searchParams.get('startDate');

  const endDate = endDateParam
    ? new Date(endDateParam)
    : endOfCurrentMonth(now);
  const startDate = startDateParam
    ? new Date(startDateParam)
    : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

  return { startDate, endDate };
}
