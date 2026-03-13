import { UNIT_LABELS } from '@/constants/units';
import type { UnitValue } from '@/constants/units';

/** enum キーから表示ラベルを取得 */
export function getUnitLabel(unit: UnitValue | string): string {
  return UNIT_LABELS[unit as UnitValue] ?? unit;
}
