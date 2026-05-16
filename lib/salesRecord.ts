import { getUnitLabel, convertByUnit, formatNumber } from '@/lib/units';
import type { CustomFieldDefinition } from '@/types/customField';
import type { SalesRecord } from '@/types/salesRecord';

/** YYYY/MM/DD HH:mm 形式 */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

/** YYYY/MM/DD 形式 */
export function formatDateShort(isoDate: string): string {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

/** レコード値をデータ種別の単位で表示用にフォーマット */
export function formatRecordValue(record: SalesRecord): string {
  const unit = record.dataType?.unit;
  const converted = unit ? convertByUnit(record.value, unit) : record.value;
  const label = unit ? getUnitLabel(unit) : '';
  return `${formatNumber(converted)}${label}`;
}

/**
 * カスタムフィールド値を表示用にフォーマットする。
 * 集計対象 (aggregatable && unit) のフィールドはメイン値と同様に
 * 単位変換 + 単位ラベル付きで表示する。それ以外はそのまま文字列化する。
 */
export function formatCustomFieldValue(
  raw: string | number | undefined | null,
  field: CustomFieldDefinition,
): string {
  if (raw === undefined || raw === null || raw === '') return '-';
  if (field.aggregatable && field.unit) {
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(num)) return String(raw);
    const converted = convertByUnit(num, field.unit);
    return `${formatNumber(converted)}${getUnitLabel(field.unit)}`;
  }
  return String(raw);
}

/** CSVフィールドのエスケープ */
export function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
