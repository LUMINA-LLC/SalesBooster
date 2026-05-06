'use client';

import { useCallback, useEffect, useState } from 'react';

interface SessionSummary {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messageCount?: number;
}

interface ChatHistoryPanelProps {
  open: boolean;
  activeSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
  onClose: () => void;
  onAfterDeleteAll: () => void;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (60 * 1000));
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

export default function ChatHistoryPanel({
  open,
  activeSessionId,
  onSelectSession,
  onClose,
  onAfterDeleteAll,
}: ChatHistoryPanelProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/sessions');
      if (!res.ok) throw new Error('履歴の取得に失敗しました');
      const json = await res.json();
      const list: SessionSummary[] =
        json?.data?.sessions ?? json?.sessions ?? [];
      setSessions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchSessions();
  }, [open, fetchSessions]);

  const handleDelete = async (sessionId: number) => {
    if (!window.confirm('この会話を削除しますか？')) return;
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      // 現在開いているセッションを消したら、アクティブをクリア
      if (sessionId === activeSessionId) {
        onAfterDeleteAll();
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('すべての会話履歴を削除しますか？元に戻せません。'))
      return;
    try {
      const res = await fetch('/api/chat/sessions', { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      setSessions([]);
      onAfterDeleteAll();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="戻る"
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">会話履歴</span>
        {sessions.length > 0 ? (
          <button
            type="button"
            onClick={handleDeleteAll}
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            すべて削除
          </button>
        ) : (
          <span className="w-12" />
        )}
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400 text-xs">
            読み込み中...
          </div>
        )}
        {error && (
          <div className="px-4 py-3 text-xs text-red-600 bg-red-50">
            {error}
          </div>
        )}
        {!loading && sessions.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-xs">
            <svg
              className="w-10 h-10 mb-2 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>まだ会話履歴はありません</p>
          </div>
        )}
        <ul className="divide-y divide-gray-100">
          {sessions.map((s) => {
            const count = s._count?.messages ?? s.messageCount ?? 0;
            const isActive = s.id === activeSessionId;
            return (
              <li
                key={s.id}
                className={`flex items-start gap-2 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50/50' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSession(s.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm text-gray-800 truncate">
                    {s.title || '(無題の会話)'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatRelative(s.updatedAt)} ・ {count}件のメッセージ
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  aria-label="この会話を削除"
                  title="この会話を削除"
                  className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
