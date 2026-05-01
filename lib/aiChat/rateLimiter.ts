/**
 * 簡易レートリミッタ（メモリベース）。
 * Lambda の単一インスタンス内のみで有効。複数インスタンスや再起動時はリセットされる。
 * 本格的な保護が必要になったら DB / Upstash 等に移行する。
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const buckets = new Map<string, number[]>();

export function consume(key: string): {
  allowed: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recent[0];
    return {
      allowed: false,
      retryAfterMs: WINDOW_MS - (now - oldest),
    };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterMs: 0 };
}
