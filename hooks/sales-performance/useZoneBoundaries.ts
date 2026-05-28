export interface ZoneBoundaries {
  hasTopBoundary: boolean;
  hasLowBoundary: boolean;
  /** TOP 20% と CENTER の境界 X 座標 (px) */
  boundary1: number;
  /** CENTER と LOW 20% の境界 X 座標 (px) */
  boundary2: number;
}

/**
 * ゾーン境界（TOP 20% / CENTER / LOW 20%）の X 座標を算出する。
 * 境界はカラム間ギャップの中央に配置することで、カラムの位置と帯背景・
 * 境界線が視覚的に揃う。
 *
 * カラム i の左端 = rowGap + i * (columnWidth + rowGap)
 * したがって i 番目のカラム直前のギャップの中央 =
 *   rowGap + i * columnWidth + (i - 1) * rowGap + rowGap / 2
 */
export function useZoneBoundaries(
  memberCount: number,
  top20Index: number,
  low20Index: number,
  columnWidth: number,
  rowGap: number,
): ZoneBoundaries {
  const hasTopBoundary =
    memberCount > 1 && top20Index > 0 && top20Index < memberCount;
  const hasLowBoundary =
    memberCount > 1 && low20Index > 0 && low20Index < memberCount;

  const boundary1 = hasTopBoundary
    ? rowGap +
      top20Index * columnWidth +
      (top20Index - 1) * rowGap +
      rowGap / 2
    : 0;
  const boundary2 = hasLowBoundary
    ? rowGap +
      low20Index * columnWidth +
      (low20Index - 1) * rowGap +
      rowGap / 2
    : 0;

  return { hasTopBoundary, hasLowBoundary, boundary1, boundary2 };
}
