'use client';

import type { AuditAnalytics } from '@/types/audit';

/** ログイン時IP別アクセスの上位ランキング（テーブル） */
export default function IpAccessChart({
  data,
}: {
  data: AuditAnalytics['ipAccess'];
}) {
  const TOP = 10;
  const rows = data.slice(0, TOP);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-gray-800">
        アクセス元IP（ログイン時・上位{TOP}）
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        ※ IPはログイン系イベントのみ記録されます
      </p>
      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">
          ログインイベントがありません
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.ip} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right text-xs font-medium text-gray-400">
                {i + 1}
              </span>
              <span className="w-32 shrink-0 truncate font-mono text-xs text-gray-700">
                {r.ip}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
                <div
                  className="h-full rounded bg-cyan-500"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-medium text-gray-600">
                {r.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
