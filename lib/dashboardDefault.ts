/** ダッシュボード初期表示設定UIで使う日付ヘルパー */

export type DashboardDefaultPeriodUnit = '月' | '週' | '日';

export interface DateRange {
  minDate: string;
  maxDate: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 月単位ラベル: "YYYY年MM月" */
export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${pad(month)}月`;
}

/** 週単位ラベル: "YYYY年 M/D〜M/D" (月曜始まり) */
export function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.getFullYear()}年 ${monday.getMonth() + 1}/${monday.getDate()}〜${sunday.getMonth() + 1}/${sunday.getDate()}`;
}

/** 日単位ラベル: "YYYY年MM月DD日" */
export function formatDayLabel(d: Date): string {
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`;
}

/** 期間グラフ用に periodUnit ごとのオプションを生成 */
export function generateDateOptions(
  minDate: Date,
  maxDate: Date,
  unit: DashboardDefaultPeriodUnit,
): string[] {
  const options: string[] = [];
  if (unit === '月') {
    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    while (cursor <= end) {
      options.push(
        formatMonthLabel(cursor.getFullYear(), cursor.getMonth() + 1),
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else if (unit === '週') {
    const cursor = getWeekMonday(minDate);
    while (cursor <= maxDate) {
      options.push(formatWeekLabel(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const cursor = new Date(minDate);
    while (cursor <= maxDate) {
      options.push(formatDayLabel(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return options;
}

/** YYYY-MM のリスト */
export function generateMonthYMs(minDate: Date, maxDate: Date): string[] {
  const options: string[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (cursor <= end) {
    options.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return options;
}

/** YYYY-MM → "YYYY年MM月" */
export function ymToLabel(ym: string): string {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  return m ? formatMonthLabel(parseInt(m[1]), parseInt(m[2])) : ym;
}
