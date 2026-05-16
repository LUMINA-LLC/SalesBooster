import { UNIT_LABELS } from '@/types/units';
import type { UnitValue } from '@/types/units';

/** enum キーから表示ラベルを取得 */
export function getUnitLabel(unit: UnitValue | string): string {
  return UNIT_LABELS[unit as UnitValue] ?? unit;
}

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

/** 単位に応じて値を変換する */
export function convertByUnit(value: number, unit: string): number {
  switch (unit) {
    case 'MAN_YEN':
      return Math.floor(value / 10000);
    case 'SEN_YEN':
      return Math.floor(value / 1000);
    default:
      return value;
  }
}

/** 数値を3桁区切り文字列に変換 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ja-JP');
}
