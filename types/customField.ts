export type CustomFieldType = 'TEXT' | 'DATE' | 'SELECT' | 'NUMBER';

export interface CustomFieldDefinition {
  id: number;
  name: string;
  fieldType: CustomFieldType;
  options: string[] | null;
  isRequired: boolean;
  aggregatable: boolean;
  unit: string;
  sortOrder: number;
  isActive: boolean;
}

export type CustomFieldValues = Record<string, string | number>;
