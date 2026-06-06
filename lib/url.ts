/** 公開 HTTPS URL かどうかを判定する（外部API送信時の画像URL検証などに使用） */
export function isHttpsUrl(url: string | null | undefined): url is string {
  return !!url && url.startsWith('https://');
}
