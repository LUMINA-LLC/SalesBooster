/**
 * YouTube URL から動画IDを抽出する
 * 対応形式: watch?v=, youtu.be/, embed/, shorts/, 直接ID
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (match) return match[1];
  // 直接IDのみの場合
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}
