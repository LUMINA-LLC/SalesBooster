import type { UnitValue } from './units';

export interface DataTypeInfo {
  id: number;
  name: string;
  unit: UnitValue;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}
