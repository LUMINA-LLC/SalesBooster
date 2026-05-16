'use client';

import Select from '@/components/common/Select';
import type {
  CustomFieldDefinition,
  CustomFieldValues,
} from '@/types/customField';
import { getUnitLabel } from '@/lib/units';

interface CustomFieldsRendererProps {
  fields: CustomFieldDefinition[];
  values: CustomFieldValues;
  onChange: (fieldId: string, value: string | number) => void;
}

export default function CustomFieldsRenderer({
  fields,
  values,
  onChange,
}: CustomFieldsRendererProps) {
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map((field) => {
        const fieldId = String(field.id);
        const rawValue = values[fieldId];
        const value =
          rawValue === undefined || rawValue === null ? '' : String(rawValue);

        switch (field.fieldType) {
          case 'TEXT':
            return (
              <div key={fieldId} className="flex items-center">
                <label className="w-24 text-sm text-gray-700 text-right pr-4">
                  {field.name}
                  {field.isRequired && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(fieldId, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            );

          case 'NUMBER': {
            const isAggregatable = field.aggregatable && !!field.unit;
            return (
              <div key={fieldId} className="flex items-center">
                <label className="w-24 text-sm text-gray-700 text-right pr-4">
                  {field.name}
                  {field.isRequired && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          onChange(fieldId, '');
                        } else {
                          const num = Number(v);
                          onChange(fieldId, Number.isFinite(num) ? num : v);
                        }
                      }}
                      className={`${isAggregatable ? 'w-32' : 'w-full'} border border-gray-300 rounded px-3 py-2 text-sm`}
                    />
                    {isAggregatable && (
                      <>
                        <span className="text-sm text-blue-600">
                          {getUnitLabel(field.unit)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          title="このフィールドは集計対象です"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="w-3 h-3"
                            aria-hidden="true"
                          >
                            <path d="M2 13a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1Zm4-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9Zm4-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V4Z" />
                          </svg>
                          集計対象
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          case 'DATE':
            return (
              <div key={fieldId} className="flex items-center">
                <label className="w-24 text-sm text-gray-700 text-right pr-4">
                  {field.name}
                  {field.isRequired && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(fieldId, e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            );

          case 'SELECT':
            return (
              <div key={fieldId} className="flex items-center">
                <label className="w-24 text-sm text-gray-700 text-right pr-4">
                  {field.name}
                  {field.isRequired && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <div className="flex-1">
                  <Select
                    value={value}
                    onChange={(v) => onChange(fieldId, v)}
                    options={[
                      { value: '', label: '選択してください...' },
                      ...((field.options || []) as string[]).map((opt) => ({
                        value: opt,
                        label: opt,
                      })),
                    ]}
                    placeholder="選択してください..."
                  />
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
