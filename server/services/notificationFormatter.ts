import { convertByUnit, formatNumber } from '@/lib/currency';
import { getUnitLabel } from '@/lib/units';
import { formatJstDate, formatJstDateTime } from '../lib/dateUtils';

export interface NotificationData {
  memberName: string;
  value: number;
  recordDate: Date;
  /** 通知送信時刻 */
  createdAt: Date;
  /** データ種別名（null時はフォールバック） */
  dataTypeName: string | null;
  /** Unit enum (MAN_YEN, KEN, ...) */
  unit: string | null;
  /** レコードに保存されたカスタムフィールドの値 (key=fieldId, value=value) */
  customFields: Record<string, string | number> | null;
  /** カスタムフィールド定義 (id → name の対応) */
  customFieldDefs: { id: number; name: string }[];
}

/**
 * 通知本文を組み立てる(LINE / Google Chat 共通)。
 *
 * 例:
 *   売上登録
 *
 *   担当: 山田 太郎
 *   売上: 1万円
 *   日付: 2026年4月25日
 *   登録時刻: 2026/04/25 14:30
 *   契約先: ABC商事
 */
export function formatSalesNotificationMessage(data: NotificationData): string {
  const dataTypeName = data.dataTypeName || 'データ';
  const unitLabel = data.unit ? getUnitLabel(data.unit) : '';
  const convertedValue = data.unit
    ? convertByUnit(data.value, data.unit)
    : data.value;
  const valueLine = `${dataTypeName}: ${formatNumber(convertedValue)}${unitLabel}`;

  const lines: string[] = [
    `${dataTypeName}登録`,
    '',
    `担当: ${data.memberName}`,
    valueLine,
    `日付: ${formatJstDate(data.recordDate)}`,
    `登録時刻: ${formatJstDateTime(data.createdAt)}`,
  ];

  // カスタムフィールド: 値があるもののみ列挙
  if (data.customFields && data.customFieldDefs.length > 0) {
    for (const def of data.customFieldDefs) {
      const raw = data.customFields[String(def.id)];
      if (raw === undefined || raw === null) continue;
      const str = typeof raw === 'string' ? raw.trim() : String(raw);
      if (str === '') continue;
      lines.push(`${def.name}: ${str}`);
    }
  }

  return lines.join('\n');
}
