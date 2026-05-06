'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatSessionSummary {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const LEGACY_STORAGE_KEY = 'miroku.aiChat.history';
const ACTIVE_SESSION_STORAGE_KEY = 'miroku.aiChat.activeSessionId';

function loadActiveSessionId(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function saveActiveSessionId(id: number | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id === null) {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, String(id));
    }
  } catch {
    // ignore
  }
}

/** 旧 localStorage 履歴（messages 配列）の存在を確認・破棄 */
function clearLegacyHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 起動時: 旧 localStorage 履歴を破棄し、保存されたアクティブセッションがあれば DB から復元
  useEffect(() => {
    clearLegacyHistory();
    const saved = loadActiveSessionId();
    if (saved !== null) {
      void loadSession(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 指定セッションを DB から取得して messages にセット */
  const loadSession = useCallback(async (sessionId: number) => {
    setIsLoadingSession(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      if (res.status === 404) {
        // セッションが存在しないなら状態をリセット
        setMessages([]);
        setActiveSessionId(null);
        saveActiveSessionId(null);
        return;
      }
      if (!res.ok) throw new Error('セッションの取得に失敗しました');
      const json = await res.json();
      const session = json?.data?.session ?? json?.session;
      if (!session) {
        setMessages([]);
        setActiveSessionId(null);
        saveActiveSessionId(null);
        return;
      }
      setActiveSessionId(session.id);
      saveActiveSessionId(session.id);
      setMessages(
        (session.messages ?? []).map(
          (m: { role: 'user' | 'model'; content: string }) => ({
            role: m.role,
            content: m.content,
          }),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  /** 新しい会話を始める（既存セッションから切り離す） */
  const startNewSession = useCallback(() => {
    abortRef.current?.abort();
    setActiveSessionId(null);
    saveActiveSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  /** メッセージ送信 */
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const newUserMsg: ChatMessage = { role: 'user', content: trimmed };
      setMessages((prev) => [
        ...prev,
        newUserMsg,
        { role: 'model', content: '' },
      ]);

      const historyForApi = messages;

      setIsStreaming(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            sessionId: activeSessionId,
            history: historyForApi,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let msg = '送信に失敗しました';
          if (res.status === 429) {
            try {
              const data = await res.json();
              msg = data.error ?? msg;
            } catch {
              // ignore
            }
          } else if (res.status === 401) {
            msg = 'ログインしてください';
          }
          throw new Error(msg);
        }

        // レスポンスヘッダからセッション ID を取得して保存
        const sessionIdHeader = res.headers.get('X-AI-Chat-Session-Id');
        if (sessionIdHeader) {
          const id = Number(sessionIdHeader);
          if (Number.isFinite(id)) {
            setActiveSessionId(id);
            saveActiveSessionId(id);
          }
        }

        if (!res.body) throw new Error('レスポンスを取得できませんでした');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let received = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'model', content: received };
            return next;
          });
        }

        if (received.trim() === '') {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'model',
              content: '応答が空でした。もう一度お試しください。',
            };
            return next;
          });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setMessages((prev) => {
            const next = [...prev];
            if (next.length > 0 && next[next.length - 1].role === 'model') {
              const last = next[next.length - 1];
              if (last.content === '') {
                next[next.length - 1] = {
                  role: 'model',
                  content: '（停止しました）',
                };
              }
            }
            return next;
          });
          return;
        }
        const msg = err instanceof Error ? err.message : '送信に失敗しました';
        setError(msg);
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1].role === 'model') {
            next[next.length - 1] = {
              role: 'model',
              content: `エラー: ${msg}`,
            };
          }
          return next;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages, activeSessionId],
  );

  /** 履歴クリア（新しい会話を始める。DB は削除しない）*/
  const clear = useCallback(() => {
    startNewSession();
  }, [startNewSession]);

  /** 現在のメッセージ送信を中断 */
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    activeSessionId,
    isStreaming,
    isLoadingSession,
    error,
    send,
    clear,
    cancel,
    loadSession,
    startNewSession,
  };
}
