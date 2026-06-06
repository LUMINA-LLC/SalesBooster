import { getUnitLabel, convertByUnit, formatNumber } from '@/lib/units';
import {
  DEFAULT_TEMPLATE,
  renderNotificationTemplate,
} from '@/types/notificationTemplate';
import { formatJstDate, formatJstDateTime } from '../lib/dateUtils';

export interface NotificationData {
  memberName: string;
  /** メンバーの顔写真URL（公開HTTPS URL。null時は画像なし） */
  memberImageUrl?: string | null;
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

/** 値・単位・種別の派生表示文字列をまとめて算出する */
function deriveValueFields(data: NotificationData) {
  const dataTypeName = data.dataTypeName || 'データ';
  const unitLabel = data.unit ? getUnitLabel(data.unit) : '';
  const convertedValue = data.unit
    ? convertByUnit(data.value, data.unit)
    : data.value;
  const valueStr = formatNumber(convertedValue);
  return { dataTypeName, unitLabel, valueStr };
}

/**
 * 値があるカスタムフィールドを {name, value} の配列で抽出する。
 * 値が undefined/null/空文字のものはスキップ。
 */
function extractCustomFieldEntries(
  data: NotificationData,
): { name: string; value: string }[] {
  if (!data.customFields || data.customFieldDefs.length === 0) return [];
  const entries: { name: string; value: string }[] = [];
  for (const def of data.customFieldDefs) {
    const raw = data.customFields[String(def.id)];
    if (raw === undefined || raw === null) continue;
    const str = typeof raw === 'string' ? raw.trim() : String(raw);
    if (str === '') continue;
    entries.push({ name: def.name, value: str });
  }
  return entries;
}

/**
 * 基本変数のキー → 値 のマップを組み立てる。
 * カスタムフィールドはフィールド名をキーに追加（基本変数と重複時は基本変数を優先）。
 */
function buildVariableMap(data: NotificationData): Record<string, string> {
  const { dataTypeName, unitLabel, valueStr } = deriveValueFields(data);

  const map: Record<string, string> = {};

  // カスタムフィールドを先に入れて、基本変数で上書き（基本変数優先）
  for (const { name, value } of extractCustomFieldEntries(data)) {
    map[name] = value;
  }

  map['担当'] = data.memberName;
  map['種別'] = dataTypeName;
  map['値'] = valueStr;
  map['単位'] = unitLabel;
  map['値と単位'] = `${valueStr}${unitLabel}`;
  map['日付'] = formatJstDate(data.recordDate);
  map['登録時刻'] = formatJstDateTime(data.createdAt);

  return map;
}

/**
 * 通知本文を組み立てる(LINE / Google Chat 共通)。
 *
 * - template 未設定（空 or undefined）の場合は DEFAULT_TEMPLATE を使う。
 * - テンプレート本文中で参照されなかったカスタムフィールドは、末尾に
 *   「項目名: 値」形式で自動追記する（テンプレート設定時もカスタム項目が
 *   通知から欠落しないようにするため）。
 *
 * 例（デフォルト）:
 *   売上登録
 *
 *   担当: 山田 太郎
 *   売上: 120万円
 *   日付: 2026年6月4日
 *   登録時刻: 2026/06/04 14:30
 *   契約先: ABC商事
 *
 * @param template 管理画面で設定されたテンプレート文字列。
 */
export function formatSalesNotificationMessage(
  data: NotificationData,
  template?: string | null,
): string {
  const trimmed = template?.trim();
  const effectiveTemplate = trimmed || DEFAULT_TEMPLATE;

  const body = renderNotificationTemplate(
    effectiveTemplate,
    buildVariableMap(data),
  );

  // テンプレート本文で {項目名} として既に参照されているカスタム項目は
  // 二重表示を避けるため末尾追記から除外する。
  const extraFields = extractCustomFieldEntries(data).filter(
    ({ name }) => !effectiveTemplate.includes(`{${name}}`),
  );

  if (extraFields.length === 0) return body;

  const extraLines = extraFields.map(({ name, value }) => `${name}: ${value}`);
  return [body, ...extraLines].join('\n');
}
