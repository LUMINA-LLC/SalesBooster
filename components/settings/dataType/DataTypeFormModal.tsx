'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';
import { UNIT_OPTIONS, DEFAULT_UNIT } from '@/types/units';
import type { UnitValue } from '@/types/units';
import type { DataTypeInfo } from '@/types';

const DEFAULT_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#6366F1',
  '#14B8A6',
];

interface DataTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  dataType?: DataTypeInfo | null;
}

export default function DataTypeFormModal({
  isOpen,
  onClose,
  onSaved,
  dataType,
}: DataTypeFormModalProps) {
  const isEdit = !!dataType;
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (dataType) {
        setName(dataType.name);
        setUnit(dataType.unit);
        setColor(dataType.color || DEFAULT_COLORS[0]);
      } else {
        setName('');
        setUnit(DEFAULT_UNIT);
        setColor(
          DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        );
      }
    }
  }, [isOpen, dataType]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      await Dialog.error('名前を入力してください。');
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/data-types/${dataType!.id}`
        : '/api/data-types';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), unit, color }),
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '保存に失敗しました。');
      }
    } catch {
      await Dialog.error('保存に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button
        label="キャンセル"
        variant="outline"
        color="gray"
        onClick={onClose}
      />
      <Button
        label={submitting ? '保存中...' : isEdit ? '更　新' : '追　加'}
        onClick={handleSubmit}
        disabled={submitting || !name.trim()}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'データ種類を編集' : 'データ種類を追加'}
      maxWidth="md"
      footer={footer}
    >
      <div className="space-y-4">
        {/* 名前 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="例: 売上、契約数、面談数"
          />
        </div>

        {/* 単位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            単位
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitValue)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 色 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            グラフの色
          </label>
          <div className="flex items-center space-x-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-gray-800 scale-125' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
