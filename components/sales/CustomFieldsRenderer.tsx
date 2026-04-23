'use client';

import React from 'react';
import Select from '@/components/common/Select';
import type {
  CustomFieldDefinition,
  CustomFieldValues,
} from '@/types/customField';

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
        const value = rawValue === undefined || rawValue === null ? '' : String(rawValue);

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
                    placeholder={field.name}
                  />
                </div>
              </div>
            );

          case 'NUMBER':
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
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder={field.name}
                  />
                </div>
              </div>
            );

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
