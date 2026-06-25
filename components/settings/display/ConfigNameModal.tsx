'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface ConfigNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** モーダルのタイトル（例: 新規設定の作成 / 設定名の変更） */
  title: string;
  /** 初期値（名前変更時は現在の名前） */
  initialValue?: string;
  /** 確定ボタンのラベル（例: 作成 / 変更） */
  confirmLabel?: string;
  /** 確定時に呼ばれる。trim 済みの名前を渡す */
  onSubmit: (name: string) => Promise<void> | void;
}

/** ディスプレイ設定の名前を入力する共通モーダル（新規作成・名前変更で共用） */
export default function ConfigNameModal({
  isOpen,
  onClose,
  title,
  initialValue = '',
  confirmLabel = 'OK',
  onSubmit,
}: ConfigNameModalProps) {
  const [name, setName] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  // 開くたびに初期値へリセット
  useEffect(() => {
    if (isOpen) setName(initialValue);
  }, [isOpen, initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
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
      <button
        type="submit"
        form="config-name-form"
        disabled={submitting || !name.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '保存中...' : confirmLabel}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={footer}
    >
      <form id="config-name-form" onSubmit={handleSubmit}>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          設定名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 営業部フロア"
          autoFocus
          maxLength={50}
        />
      </form>
    </Modal>
  );
}
