'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-gray-900/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* モーダル */}
      <div
        className={`relative bg-white rounded-xl shadow-xl ring-1 ring-gray-900/5 w-full ${maxWidthClasses[maxWidth]} mx-4 max-h-[90vh] flex flex-col`}
        style={{ animation: 'modalSlideIn 0.3s ease-out' }}
      >
        {/* ヘッダー */}
        <div className="relative px-5 py-3.5 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 text-center">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="absolute top-2.5 right-3 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* フッター */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-gray-100 flex justify-center gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style jsx global>{`
        /* Bootstrap モーダル相当: 上方向に少しずれた位置からスライドイン + フェードイン */
        @keyframes modalSlideIn {
          0% {
            transform: translateY(-50px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
