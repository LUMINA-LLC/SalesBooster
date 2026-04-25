'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { CustomSlideType, CustomSlideData } from '@/types/display';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { extractYouTubeId } from '@/lib/youtube';

interface CustomSlideModalProps {
  open: boolean;
  onClose: () => void;
  /** create成功時 / update成功時 共通コールバック */
  onSaved: () => void;
  /** 指定時は編集モード(create時はundefined/null) */
  slide?: CustomSlideData | null;
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

const SLIDE_TYPE_LABELS: Record<CustomSlideType, string> = {
  IMAGE: '画像',
  YOUTUBE: 'YouTube動画',
  TEXT: 'テキスト',
};

export default function CustomSlideModal({
  open,
  onClose,
  onSaved,
  slide,
}: CustomSlideModalProps) {
  const isEdit = !!slide;
  const [slideType, setSlideType] = useState<CustomSlideType>('IMAGE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  /** 編集モードで既存画像を表示するためのURL(差し替え時はpreviewが優先) */
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSlideType('IMAGE');
    setTitle('');
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setError(null);
  };

  // モーダルが開かれた時 / slide が変わった時に初期値を流し込む
  useEffect(() => {
    if (!open) return;
    if (slide) {
      setSlideType(slide.slideType);
      setTitle(slide.title || '');
      setContent(slide.content || '');
      setImageFile(null);
      setImagePreview(null);
      setExistingImageUrl(slide.imageUrl || null);
      setError(null);
    } else {
      resetForm();
    }
  }, [open, slide]);

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
      let imageUrl = existingImageUrl ?? '';

      if (slideType === 'IMAGE') {
        if (imageFile) {
          // 新しい画像を選択した場合のみアップロード
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
        } else if (!isEdit) {
          // 新規時は画像必須
          setError('画像を選択してください');
          setSaving(false);
          return;
        }
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

      if (isEdit && slide) {
        // 更新 (slideType は変更不可)
        const res = await fetch(`/api/custom-slides/${slide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content: slideType === 'IMAGE' ? '' : content,
            imageUrl,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'スライドの更新に失敗しました');
        }
      } else {
        // 新規作成
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
      }

      resetForm();
      onSaved();
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
      title={
        isEdit
          ? `カスタムスライドを編集（${SLIDE_TYPE_LABELS[slideType]}）`
          : 'カスタムスライドを追加'
      }
      footer={
        <>
          <Button
            label="キャンセル"
            onClick={handleClose}
            variant="outline"
            color="gray"
          />
          <Button
            label={
              saving
                ? isEdit
                  ? '更新中...'
                  : '追加中...'
                : isEdit
                  ? '更　新'
                  : '追　加'
            }
            onClick={handleSubmit}
            disabled={saving}
          />
        </>
      }
    >
      <div className="space-y-4">
        {/* タイプ選択 (新規時のみ) */}
        {!isEdit && (
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
                  <div className="text-xs mt-1 opacity-70">
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
              {isEdit && (
                <span className="ml-2 text-xs text-gray-400">
                  （変更しない場合はそのまま）
                </span>
              )}
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
              ) : existingImageUrl ? (
                <div>
                  <Image
                    src={existingImageUrl}
                    alt="現在の画像"
                    width={320}
                    height={160}
                    className="max-h-40 mx-auto rounded object-contain"
                    unoptimized
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    クリックまたはドラッグ&ドロップで画像を変更
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
