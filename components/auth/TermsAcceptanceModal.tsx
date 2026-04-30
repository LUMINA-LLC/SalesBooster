'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession, signOut } from 'next-auth/react';
import { Dialog } from '@/components/common/Dialog';
import Button from '@/components/common/Button';

const PdfScrollViewer = dynamic(
  () => import('@/components/common/PdfScrollViewer'),
  { ssr: false },
);

type TermsTab = 'terms' | 'privacy';

interface TabState {
  scrolledToBottom: boolean;
  agreed: boolean;
}

const TAB_META: Record<TermsTab, { label: string; fileUrl: string }> = {
  terms: { label: '利用規約', fileUrl: '/docs/terms_of_service.pdf' },
  privacy: {
    label: 'プライバシーポリシー',
    fileUrl: '/docs/privacy_policy.pdf',
  },
};

export default function TermsAcceptanceModal() {
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState<TermsTab>('terms');
  const [terms, setTerms] = useState<TabState>({
    scrolledToBottom: false,
    agreed: false,
  });
  const [privacy, setPrivacy] = useState<TabState>({
    scrolledToBottom: false,
    agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = terms.agreed && privacy.agreed;

  const currentState = activeTab === 'terms' ? terms : privacy;
  const setCurrent = activeTab === 'terms' ? setTerms : setPrivacy;
  const currentLabel = TAB_META[activeTab].label;
  const currentFileUrl = TAB_META[activeTab].fileUrl;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/users/me/accept-terms', { method: 'POST' });
      if (res.ok) {
        // session を最新化（jwt callback の trigger='update' を起動）
        await update();
      } else {
        const data = await res.json().catch(() => null);
        await Dialog.error(data?.error || '同意の記録に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to accept terms:', error);
      await Dialog.error(
        '同意の記録に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    const ok = await Dialog.confirm(
      '利用規約・プライバシーポリシーに同意しない場合はサインアウトされます。よろしいですか？',
    );
    if (!ok) return;
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 text-center">
            利用規約・プライバシーポリシー
          </h2>
        </div>

        <div className="flex border-b border-gray-200 px-4 pt-3 shrink-0">
          {(Object.keys(TAB_META) as TermsTab[]).map((key) => {
            const isActive = activeTab === key;
            const agreed = key === 'terms' ? terms.agreed : privacy.agreed;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px rounded-t-md transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-700 bg-blue-50/60'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>{TAB_META[key].label}</span>
                {agreed && (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 px-6 py-4 flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            <PdfScrollViewer
              key={activeTab}
              fileUrl={currentFileUrl}
              onScrolledToBottom={() =>
                setCurrent((s) => ({ ...s, scrolledToBottom: true }))
              }
            />
          </div>

          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              currentState.scrolledToBottom
                ? 'border-gray-300 cursor-pointer hover:bg-gray-50'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70'
            }`}
          >
            <input
              type="checkbox"
              checked={currentState.agreed}
              disabled={!currentState.scrolledToBottom}
              onChange={(e) =>
                setCurrent((s) => ({ ...s, agreed: e.target.checked }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">
              {currentLabel}に同意します
              {!currentState.scrolledToBottom && (
                <span className="ml-2 text-xs text-gray-500">
                  （最後までスクロールしてください）
                </span>
              )}
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={handleDecline}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            同意せずサインアウト
          </button>
          <Button
            label={submitting ? '送信中...' : '同意して進む'}
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          />
        </div>
      </div>
    </div>
  );
}
