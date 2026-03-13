'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { CustomSlideType } from '@/types/display';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { extractYouTubeId } from '@/lib/youtube';

interface AddCustomSlideModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SLIDE_TYPE_OPTIONS: {
  value: CustomSlideType;
  label: string;
  description: string;
}[] = [
  {
    value: 'IMAGE',
    label: '画像',
    description: 'JPG/PNG/WebP画像をアップロード',
  },
  {
    value: 'YOUTUBE',
    label: 'YouTube動画',
    description: 'YouTube動画のURLを指定',
  },
  { value: 'TEXT', label: 'テキスト', description: 'タイトルと本文を表示' },
];

export default function AddCustomSlideModal({
  open,
  onClose,
  onCreated,
}: AddCustomSlideModalProps) {
  const [slideType, setSlideType] = useState<CustomSlideType>('IMAGE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSlideType('IMAGE');
    setTitle('');
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('JPG、PNG、WebP形式の画像のみ対応しています');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    try {
      let imageUrl = '';

      if (slideType === 'IMAGE') {
        if (!imageFile) {
          setError('画像を選択してください');
          setSaving(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          throw new Error(
            uploadErr.error || '画像のアップロードに失敗しました',
          );
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      if (slideType === 'YOUTUBE' && !content) {
        setError('YouTube URLを入力してください');
        setSaving(false);
        return;
      }

      if (slideType === 'TEXT' && !content) {
        setError('本文を入力してください');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/custom-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideType,
          title,
          content: slideType === 'IMAGE' ? '' : content,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'スライドの作成に失敗しました');
      }

      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const youtubeId =
    slideType === 'YOUTUBE' && content ? extractYouTubeId(content) : null;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="カスタムスライドを追加"
      footer={
        <>
          <Button
            label="キャンセル"
            onClick={handleClose}
            variant="outline"
            color="gray"
          />
          <Button
            label={saving ? '追加中...' : '追加'}
            onClick={handleSubmit}
            disabled={saving}
          />
        </>
      }
    >
      <div className="space-y-4">
        {/* タイプ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            スライドタイプ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SLIDE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSlideType(opt.value);
                  setError(null);
                }}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  slideType === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs mt-1 opacity-70">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* タイトル（共通） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイトル{' '}
            {slideType !== 'TEXT' && (
              <span className="text-gray-400">（任意）</span>
            )}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="スライドのタイトル"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* タイプ別フォーム */}
        {slideType === 'IMAGE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画像
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              {imagePreview ? (
                <div>
                  <Image
                    src={imagePreview}
                    alt="プレビュー"
                    width={320}
                    height={160}
                    className="max-h-40 mx-auto rounded object-contain"
                    unoptimized
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {imageFile?.name}
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    className="w-10 h-10 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    クリックまたはドラッグ&ドロップで画像を選択
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WebP（5MB以下）
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
        )}

        {slideType === 'YOUTUBE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube URL
            </label>
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {youtubeId && (
              <div className="mt-2">
                <Image
                  src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                  alt="サムネイル"
                  width={320}
                  height={180}
                  className="rounded w-full max-w-xs"
                />
              </div>
            )}
          </div>
        )}

        {slideType === 'TEXT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="お知らせの本文を入力..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
