'use client';

import React from 'react';
import { getUnitLabel } from '@/lib/units';
import CustomFieldSection from './CustomFieldSection';
import type { DataTypeInfo } from '@/types/dataType';

interface DataTypeDetailProps {
  dataType: DataTypeInfo;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export default function DataTypeDetail({
  dataType,
  onEdit,
  onToggleActive,
  onDelete,
}: DataTypeDetailProps) {
  return (
    <div className="space-y-8">
      {/* 基本設定 */}
      <section>
        <h4 className="font-semibold text-gray-800 mb-3">基本設定</h4>
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: dataType.color || '#3B82F6' }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-800">
                  {dataType.name}
                </span>
                {dataType.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                    デフォルト
                  </span>
                )}
                {!dataType.isActive && (
                  <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                    無効
                  </span>
                )}
              </div>
              <div className="mt-0.5">
                <span className="text-xs text-gray-400">
                  単位: {getUnitLabel(dataType.unit)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleActive}
              className={`p-1.5 transition-colors ${dataType.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-green-500'}`}
              title={dataType.isActive ? '無効にする' : '有効にする'}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {dataType.isActive ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              title="編集"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            {!dataType.isDefault && (
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                title="削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* カスタム入力フィールド */}
      <CustomFieldSection dataTypeId={dataType.id} />
    </div>
  );
}
