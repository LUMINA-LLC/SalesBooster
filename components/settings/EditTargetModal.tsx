'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface TargetData {
  id: number;
  memberId: string;
  memberName: string;
  monthly: number;
  quarterly: number;
  annual: number;
  year: number;
  month: number;
  dataTypeId: number | null;
}

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  target: TargetData | null;
}

export default function EditTargetModal({
  isOpen,
  onClose,
  onUpdated,
  target,
}: EditTargetModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [monthly, setMonthly] = useState('');
  const [quarterly, setQuarterly] = useState('');
  const [annual, setAnnual] = useState('');

  useEffect(() => {
    if (isOpen && target) {
      setMonthly(String(target.monthly));
      setQuarterly(String(target.quarterly));
      setAnnual(String(target.annual));
    }
  }, [isOpen, target]);

  const handleSubmit = async () => {
    if (!target || !monthly || !quarterly || !annual) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: target.memberId,
          monthly: Number(monthly),
          quarterly: Number(quarterly),
          annual: Number(annual),
          year: target.year,
          month: target.month,
        }),
      });
      if (res.ok) {
        onClose();
        await Dialog.success('目標を更新しました。');
        onUpdated();
      } else {
        const data = await res.json();
        await Dialog.error(data.error || '更新に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to update target:', error);
      await Dialog.error('更新に失敗しました。');
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
        label={submitting ? '更新中...' : '更新'}
        onClick={handleSubmit}
        disabled={submitting || !monthly || !quarterly || !annual}
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="目標を編集"
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-500">メンバー:</span>
          <span className="text-sm font-medium text-gray-800 ml-2">
            {target?.memberName}
          </span>
          <span className="text-sm text-gray-500 ml-4">
            {target?.year}年{target?.month}月
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            月間目標（万円） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            四半期目標（万円） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={quarterly}
            onChange={(e) => setQuarterly(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            年間目標（万円） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1200"
          />
        </div>
      </div>
    </Modal>
  );
}
