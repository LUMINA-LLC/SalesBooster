/**
 * 単位に応じた入力プリセット値を返す
 */
export function getValuePresets(unit: string): number[] {
  switch (unit) {
    case 'MAN_YEN':
      return [1, 5, 10, 50, 100];
    case 'SEN_YEN':
      return [1, 5, 10, 50, 100];
    case 'YEN':
      return [100, 500, 1000, 5000, 10000];
    case 'KEN':
      return [1, 2, 3, 5, 10];
    default:
      return [1, 5, 10, 50, 100];
  }
}
