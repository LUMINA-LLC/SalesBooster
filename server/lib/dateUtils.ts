/**
 * 日付計算ヘルパー
 * salesController 等で繰り返し使われるデフォルト日付パターンを集約。
 */

/** JST 固定オフセット (ミリ秒) */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface JstParts {
  year: number;
  /** 1〜12 */
  month: number;
  /** 1〜31 */
  day: number;
  /** 0〜23 */
  hour: number;
  /** 0〜59 */
  minute: number;
  /** 0〜59 */
  second: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Date を JST に換算した上で年/月/日/時/分/秒を取り出す。
 *
 * サーバプロセスのタイムゾーン (Amplify は UTC) に依存せず、常に日本時間で扱う。
 * フロント (JST 想定) から ISO 文字列で渡された値を JST として再解釈したい場合や、
 * 通知メッセージに JST 固定の日時を出力したい場合に利用する。
 */
export function toJstParts(date: Date): JstParts {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    // getUTCMonth() は 0始まり → +1 して 1始まりに
    month: jst.getUTCMonth() + 1,
    day: jst.getUTCDate(),
    hour: jst.getUTCHours(),
    minute: jst.getUTCMinutes(),
    second: jst.getUTCSeconds(),
  };
}

/** Date を JST として年/月のみ取り出す (toJstParts のショートカット) */
export function getJstYearMonth(date: Date): { year: number; month: number } {
  const { year, month } = toJstParts(date);
  return { year, month };
}

/** "YYYY年M月D日" 形式 (JST固定) */
export function formatJstDate(date: Date): string {
  const p = toJstParts(date);
  return `${p.year}年${p.month}月${p.day}日`;
}

/** "YYYY/MM/DD HH:mm" 形式 (JST固定) */
export function formatJstDateTime(date: Date): string {
  const p = toJstParts(date);
  return `${p.year}/${pad2(p.month)}/${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** "YYYY-MM" 形式の月キー (JST固定) */
export function formatJstMonthKey(date: Date): string {
  const p = toJstParts(date);
  return `${p.year}-${pad2(p.month)}`;
}

/**
 * JST 月初を表す Date を返す。
 *
 * 内部表現は UTC だが、JST の `YYYY-MM-01 00:00:00` を表す。
 * (JST 0:00 は UTC で前日 15:00 になるため、Date.UTC(y, m-1, 1, -9) で生成)
 */
export function jstStartOfMonth(year: number, month: number): Date {
  // year, month (1始まり) を JST の月初として解釈
  return new Date(Date.UTC(year, month - 1, 1, -9, 0, 0));
}

/**
 * JST 月末日 23:59:59.999 を表す Date を返す。
 */
export function jstEndOfMonth(year: number, month: number): Date {
  // 翌月初日 - 1ミリ秒
  return new Date(Date.UTC(year, month, 1, -9, 0, 0) - 1);
}

/**
 * 現在時刻を JST に変換した parts を返す。サーバTZに依存しない。
 */
export function jstNow(): JstParts {
  return toJstParts(new Date());
}

/**
 * Date を JST に換算した上での曜日 (0=日, 1=月, ..., 6=土) を返す。
 */
export function getJstDay(date: Date): number {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.getUTCDay();
}

/**
 * Date を JST に換算した上での日 (1〜31) を返す。
 */
export function getJstDate(date: Date): number {
  return toJstParts(date).day;
}

/** JST 当月末日 23:59:59.999 を表す Date を返す */
export function endOfCurrentJstMonth(now = new Date()): Date {
  const p = toJstParts(now);
  return jstEndOfMonth(p.year, p.month);
}

/**
 * searchParams から startDate / endDate をパースし、
 * 指定がなければ endDate → JST当月末、startDate → endDate から 12 ヶ月前の JST月初を返す。
 */
export function parseTrailingTwelveJstMonthsRange(
  searchParams: URLSearchParams,
  now = new Date(),
): { startDate: Date; endDate: Date } {
  const endDateParam = searchParams.get('endDate');
  const startDateParam = searchParams.get('startDate');

  const endDate = endDateParam
    ? new Date(endDateParam)
    : endOfCurrentJstMonth(now);
  const endP = toJstParts(endDate);
  // endDate から 12 ヶ月前の JST月初
  let y = endP.year;
  let m = endP.month - 11;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  const startDate = startDateParam
    ? new Date(startDateParam)
    : jstStartOfMonth(y, m);

  return { startDate, endDate };
}
