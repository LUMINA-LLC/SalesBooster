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
 * "YYYY-MM-DD" を、その日の JST 00:00:00.000 を表す Date に変換する。
 * 素の new Date("YYYY-MM-DD") は UTC 0時(=JST 9時)になり境界がずれるため、
 * 日付フィルタの下限には必ずこちらを使う。不正な入力は null を返す。
 */
export function jstStartOfDay(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000+09:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * "YYYY-MM-DD" を、その日の JST 23:59:59.999 を表す Date に変換する。
 * 日付フィルタの上限（その日いっぱいを含める）に使う。不正な入力は null を返す。
 */
export function jstEndOfDay(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T23:59:59.999+09:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * JST 当月の月初〜月末を返す（クエリに依存せず常に当月としたい用途で使う）。
 */
export function currentJstMonthRange(now = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  const p = toJstParts(now);
  return {
    startDate: jstStartOfMonth(p.year, p.month),
    endDate: endOfCurrentJstMonth(now),
  };
}

/**
 * searchParams から startDate / endDate をパースし、
 * 指定がなければ「JST当月の月初〜月末」を返す。
 * （期間グラフ・前期間平均・速報など、デフォルトを当月としたい用途で使う）
 */
export function parseCurrentJstMonthRange(
  searchParams: URLSearchParams,
  now = new Date(),
): { startDate: Date; endDate: Date } {
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const p = toJstParts(now);

  const startDate = startDateParam
    ? new Date(startDateParam)
    : jstStartOfMonth(p.year, p.month);
  const endDate = endDateParam
    ? new Date(endDateParam)
    : endOfCurrentJstMonth(now);

  return { startDate, endDate };
}

/**
 * searchParams から startDate / endDate をパースし、
 * 指定がなければ「JST当年1月の月初〜当月末」を返す（累計グラフ用）。
 */
export function parseYearToCurrentJstRange(
  searchParams: URLSearchParams,
  now = new Date(),
): { startDate: Date; endDate: Date } {
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const p = toJstParts(now);

  const startDate = startDateParam
    ? new Date(startDateParam)
    : jstStartOfMonth(p.year, 1);
  const endDate = endDateParam
    ? new Date(endDateParam)
    : endOfCurrentJstMonth(now);

  return { startDate, endDate };
}

/**
 * searchParams から startDate / endDate をパースし、
 * 指定がなければ「直近3ヶ月（当月含む3ヶ月前の月初〜当月末）」を返す（ランキングボード用）。
 */
export function parseRecentThreeJstMonthsRange(
  searchParams: URLSearchParams,
  now = new Date(),
): { startDate: Date; endDate: Date } {
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const p = toJstParts(now);

  let recentStartY = p.year;
  let recentStartM = p.month - 2;
  while (recentStartM < 1) {
    recentStartM += 12;
    recentStartY -= 1;
  }

  const startDate = startDateParam
    ? new Date(startDateParam)
    : jstStartOfMonth(recentStartY, recentStartM);
  const endDate = endDateParam
    ? new Date(endDateParam)
    : endOfCurrentJstMonth(now);

  return { startDate, endDate };
}

/**
 * レポートサマリー用の基準月と、フィルタ解決用の集計範囲（基準月の23ヶ月前の月初〜基準月末）を返す。
 * - baseDate: startDate 指定があればその月、なければ当月。
 * - rangeStart/rangeEnd: グループ所属メンバーを解決するための全体範囲。
 */
export function parseReportSummaryRange(searchParams: URLSearchParams): {
  baseDate: Date;
  rangeStart: Date;
  rangeEnd: Date;
} {
  const startDateParam = searchParams.get('startDate');
  const baseDate = startDateParam ? new Date(startDateParam) : new Date();

  const baseYM = getJstYearMonth(baseDate);
  let sy = baseYM.year;
  let sm = baseYM.month - 23;
  while (sm < 1) {
    sm += 12;
    sy -= 1;
  }
  const rangeStart = jstStartOfMonth(sy, sm);
  const rangeEnd = jstEndOfMonth(baseYM.year, baseYM.month);

  return { baseDate, rangeStart, rangeEnd };
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
