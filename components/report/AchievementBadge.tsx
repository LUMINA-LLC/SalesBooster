/** 達成率バッジ */
export default function AchievementBadge({
  achievement,
}: {
  achievement: number | null;
}) {
  if (achievement === null) return null;
  const color =
    achievement >= 100
      ? 'bg-red-100 text-red-600'
      : achievement >= 80
        ? 'bg-orange-100 text-orange-600'
        : 'bg-gray-100 text-gray-500';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {achievement}%
    </span>
  );
}
