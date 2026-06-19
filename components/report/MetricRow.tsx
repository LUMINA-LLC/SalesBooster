import { ReportMetric } from '@/types/report';
import { getUnitLabel, formatNumber } from '@/lib/units';
import AchievementBadge from './AchievementBadge';

interface MetricRowProps {
  label: string;
  metric: ReportMetric;
  /** メイン値行（太字・展開トグル付き）として強調表示するか */
  emphasize?: boolean;
  /** 展開トグル（カスタムフィールドを持つメイン値行のみ） */
  toggle?: { expanded: boolean; onToggle: () => void };
}

/** 1指標（メイン値 / カスタムフィールド）の行 */
export default function MetricRow({
  label,
  metric,
  emphasize = false,
  toggle,
}: MetricRowProps) {
  const unitLabel = getUnitLabel(metric.unit);
  return (
    <div
      className={`flex items-center gap-3 py-1 ${
        emphasize ? '' : 'pl-4 text-sm text-gray-500'
      }`}
    >
      <span
        className={`flex w-28 shrink-0 items-center gap-2 ${
          emphasize ? 'font-medium text-gray-700' : ''
        }`}
      >
        {toggle ? (
          <button
            type="button"
            onClick={toggle.onToggle}
            aria-label={toggle.expanded ? '折りたたむ' : '展開する'}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 text-xs leading-none text-gray-500 hover:bg-gray-100"
          >
            {toggle.expanded ? '−' : '+'}
          </button>
        ) : (
          emphasize && <span className="w-4 shrink-0" />
        )}
        {label}
      </span>
      <span
        className={`w-28 shrink-0 text-right tabular-nums ${
          emphasize ? 'text-sm font-bold text-gray-800' : ''
        }`}
      >
        {formatNumber(metric.value)}
        <span className="ml-0.5 text-xs font-normal text-gray-400">
          {unitLabel}
        </span>
      </span>
      <span className="w-24 shrink-0 text-right tabular-nums text-gray-400">
        {metric.target !== null ? (
          <>
            {formatNumber(metric.target)}
            <span className="ml-0.5 text-[10px]">{unitLabel}</span>
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </span>
      <span className="w-14 shrink-0 text-right">
        <AchievementBadge achievement={metric.achievement} />
      </span>
    </div>
  );
}
