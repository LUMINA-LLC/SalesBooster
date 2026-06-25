'use client';

import type { AuditAnalytics } from '@/types/audit';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 件数→セルの背景色（濃淡）。max を基準に均等4分割し、count>0 の最小域を含め5段階。
 * 0:灰 / (0,0.25]:最薄 / (0.25,0.5] / (0.5,0.75] / (0.75,1]:最濃
 */
function cellColor(count: number, max: number): string {
  if (count === 0) return 'bg-gray-50';
  const ratio = count / max;
  if (ratio > 0.75) return 'bg-cyan-700';
  if (ratio > 0.5) return 'bg-cyan-500';
  if (ratio > 0.25) return 'bg-cyan-300';
  return 'bg-cyan-100';
}

/** 時間帯×曜日のアクティビティヒートマップ（CSSグリッド） */
export default function HourlyHeatmap({
  data,
}: {
  data: AuditAnalytics['hourlyHeatmap'];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  // day-hour で引けるマップ
  const grid = new Map(data.map((d) => [`${d.day}-${d.hour}`, d.count]));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          時間帯 × 曜日ヒートマップ
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>少</span>
          <span className="h-3 w-3 rounded-sm bg-cyan-100" />
          <span className="h-3 w-3 rounded-sm bg-cyan-300" />
          <span className="h-3 w-3 rounded-sm bg-cyan-500" />
          <span className="h-3 w-3 rounded-sm bg-cyan-700" />
          <span>多</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* 時間ラベル（0,3,6,...,21） */}
          <div className="mb-1 flex pl-7">
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] text-gray-400"
              >
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>

          {/* 曜日行 */}
          {DAY_LABELS.map((label, day) => (
            <div key={day} className="mb-1 flex items-center">
              <div className="w-7 shrink-0 text-center text-[11px] text-gray-500">
                {label}
              </div>
              <div className="flex flex-1 gap-0.5">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const count = grid.get(`${day}-${hour}`) ?? 0;
                  return (
                    <div
                      key={hour}
                      title={`${label}曜 ${hour}時台：${count.toLocaleString()} 件`}
                      className={`aspect-square flex-1 rounded-sm ${cellColor(
                        count,
                        max,
                      )}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
