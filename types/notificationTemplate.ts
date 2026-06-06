/**
 * 速報通知テンプレートの共有定義。
 * サーバー（notificationFormatter）とクライアント（設定UIのプレビュー）の双方から参照する。
 */

/**
 * テンプレート未設定時に使われる標準フォーマット（変数表記）。
 * notificationFormatter の formatDefaultMessage() と同じ見た目になるよう揃えてある。
 * 設定画面では未設定時の初期値として textarea に表示する。
 */
export const DEFAULT_TEMPLATE = [
  '{種別}登録',
  '',
  '担当: {担当}',
  '{種別}: {値と単位}',
  '日付: {日付}',
  '登録時刻: {登録時刻}',
].join('\n');

/** テンプレートで使える基本変数の定義（挿入ボタン・説明・プレビュー用） */
export const TEMPLATE_VARIABLES: {
  key: string;
  label: string;
  /** プレビュー用サンプル値 */
  sample: string;
}[] = [
  { key: '担当', label: '担当者名', sample: '山田 太郎' },
  { key: '種別', label: 'データ種別名', sample: '売上' },
  { key: '値', label: '値（単位なし）', sample: '120' },
  { key: '単位', label: '単位', sample: '万円' },
  { key: '値と単位', label: '値＋単位', sample: '120万円' },
  { key: '日付', label: '記録日', sample: '2026年6月4日' },
  { key: '登録時刻', label: '登録日時', sample: '2026/06/04 14:30' },
];

/**
 * テンプレート文字列内の {変数名} を、与えられた値マップで置換する。
 * 未定義の変数はそのまま（{...}）残す。
 * サーバー・クライアント共通の置換ロジック。
 */
export function renderNotificationTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{([^{}]+)\}/g, (match, rawName: string) => {
    const name = rawName.trim();
    return Object.prototype.hasOwnProperty.call(variables, name)
      ? variables[name]
      : match;
  });
}

/**
 * プレビュー用: サンプル値（＋任意のカスタムフィールドサンプル）で
 * テンプレートを展開する。クライアント側で使用。
 */
export function previewNotificationTemplate(
  template: string,
  customFieldNames: string[] = [],
): string {
  const variables: Record<string, string> = {};
  // カスタムフィールドを先に（基本変数優先のため）
  for (const name of customFieldNames) {
    variables[name] = `（${name}の例）`;
  }
  for (const v of TEMPLATE_VARIABLES) {
    variables[v.key] = v.sample;
  }
  return renderNotificationTemplate(template, variables);
}
