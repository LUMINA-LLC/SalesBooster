'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const STORAGE_KEY = 'miroku.aiChat.history';
const MAX_STORED_MESSAGES = 40;

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is ChatMessage =>
          m &&
          (m.role === 'user' || m.role === 'model') &&
          typeof m.content === 'string',
      )
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
    );
  } catch {
    // quota exceeded などは無視
  }
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 初期化時に localStorage から履歴を復元
  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  // 履歴更新ごとに保存
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const newUserMsg: ChatMessage = { role: 'user', content: trimmed };
      // ストリーミング受信用の空の model メッセージを先に追加
      const placeholderIndex = -1; // 後で計算
      setMessages((prev) => [
        ...prev,
        newUserMsg,
        { role: 'model', content: '' },
      ]);

      const historyForApi = messages; // 直前までの履歴（user/model 既存分のみ）

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

        if (!res.body) throw new Error('レスポンスを取得できませんでした');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let received = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += decoder.decode(value, { stream: true });
          // 末尾の placeholder メッセージを更新
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'model', content: received };
            return next;
          });
        }

        // 空応答チェック
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
        if ((err as Error).name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : '送信に失敗しました';
        setError(msg);
        // placeholder に短いエラーメッセージを残す
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
    [isStreaming, messages],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    abortRef.current?.abort();
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    send,
    clear,
    cancel,
  };
}
