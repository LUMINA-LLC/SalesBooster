/**
 * Date を <input type="datetime-local"> 用の "YYYY-MM-DDTHH:mm" 文字列に
 * **ローカルタイムゾーン** で整形する。
 *
 * 注意: Date.prototype.toISOString() は UTC を返すため、JST 環境で使うと
 * 入力欄に 9 時間ずれた値が表示されてしまう。本関数はそれを回避する。
 */
export function toLocalDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
