'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAiChat } from '@/hooks/useAiChat';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';

/** ディスプレイモードや非認証ページでは表示しない */
const HIDDEN_PATH_PREFIXES = ['/display', '/login', '/admin/login'];

const CHAT_GRADIENT_STYLE = {
  background:
    'linear-gradient(135deg, #6dd5ed 0%, #2193b0 30%, #6dd5ed 50%, #cc2b5e 70%, #ff6a88 100%)',
};

/** 閉じるアニメーションの長さ（globals.css の chat-slide-down と一致させる） */
const CLOSE_ANIMATION_MS = 220;

export default function ChatWidget() {
  const { status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // mounted: ウィンドウが DOM 上に存在するか。
  // open=false に切り替わった後、閉じるアニメーション完了まで一時的に true のまま残す。
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const {
    messages,
    activeSessionId,
    isStreaming,
    error,
    send,
    cancel,
    loadSession,
    startNewSession,
  } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // open の切り替わりに合わせて mounted を制御する
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  // 新規メッセージで自動スクロール
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // 入力内容に応じて textarea の高さを自動調整
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [input, open]);

  // ウィンドウを開いた時、AI 応答完了時に入力欄へフォーカスを戻す
  useEffect(() => {
    if (!open || isStreaming) return;
    textareaRef.current?.focus();
  }, [open, isStreaming]);

  // キーボードショートカット: Ctrl/Cmd+/ で開閉、Esc で閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (status !== 'authenticated') return null;
  if (pathname && HIDDEN_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await send(text);
  };

  return (
    <>
      {/* フローティングボタン（閉じるアニメーション完了後に表示） */}
      {!mounted && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="AIサポートを開く"
          style={CHAT_GRADIENT_STYLE}
          className="animate-chat-button-pulse fixed bottom-5 right-5 z-50 w-16 h-16 rounded-full text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            className="w-7 h-7 drop-shadow-sm"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* チャットウィンドウ（mounted 中は表示し、open に応じてスライドアニメ） */}
      {mounted && (
        <div
          className={`${open ? 'animate-chat-slide-up' : 'animate-chat-slide-down'} fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-1.5rem))] h-[min(680px,calc(100vh-2.5rem))] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden`}
        >
          {/* ヘッダー: グラデーション */}
          <div
            style={CHAT_GRADIENT_STYLE}
            className="relative px-4 py-3 text-white"
          >
            {/* 装飾の半透明サークル */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 left-12 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* M ロゴ円形バッジ */}
                <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                  <span
                    className="text-2xl font-bold leading-none"
                    style={{
                      fontFamily: 'var(--font-fredoka), sans-serif',
                      background:
                        'linear-gradient(135deg, #2193b0 0%, #cc2b5e 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    M
                  </span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span
                    className="text-base font-semibold tracking-wide"
                    style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
                  >
                    Miroku AI
                  </span>
                  <span className="text-[11px] text-white/85">
                    AIチャットサポート
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryOpen(true);
                  }}
                  aria-label="会話履歴を表示"
                  title="会話履歴"
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                {(messages.length > 0 || activeSessionId !== null) && (
                  <button
                    type="button"
                    onClick={startNewSession}
                    aria-label="新しい会話を始める"
                    title="新しい会話を始める"
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
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
            </div>
          </div>

          {/* メッセージ表示エリア */}
          <div
            ref={scrollRef}
            className="chat-bg-pattern flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {messages.length === 0 && <EmptyState onSelect={setInput} />}

            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}

            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-end gap-2 animate-chat-msg-slide-in">
                <AssistantAvatar />
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <span className="inline-flex gap-1.5 items-center h-4">
                    <Dot delay={0} color="#2193b0" />
                    <Dot delay={200} color="#a855f7" />
                    <Dot delay={400} color="#cc2b5e" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-start gap-2">
              <svg
                className="w-4 h-4 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* 入力エリア */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-100 p-3 bg-white"
          >
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3 py-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={
                  isStreaming
                    ? '応答中…（停止ボタンで中断）'
                    : '質問を入力（Enterで送信）'
                }
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none bg-transparent border-0 outline-none text-sm leading-5 py-2 block disabled:opacity-50 max-h-32 placeholder:text-gray-400 overflow-y-auto"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={cancel}
                  aria-label="停止"
                  title="停止"
                  className="shrink-0 w-9 h-9 rounded-full bg-gray-700 text-white flex items-center justify-center transition-all hover:bg-gray-800 active:scale-95 shadow-md"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="送信"
                  style={CHAT_GRADIENT_STYLE}
                  className="shrink-0 w-9 h-9 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                >
                  <svg
                    className="w-4 h-4 -translate-x-px translate-y-px"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-1.5 px-1">
              <p className="text-[10px] text-gray-400">
                ※ 個人情報の入力はお控えください
              </p>
              <p className="text-[10px] text-gray-400">
                <kbd className="px-1 py-0.5 rounded border border-gray-200 bg-white text-gray-500 text-[9px] font-mono">
                  Ctrl + /
                </kbd>{' '}
                で開閉
              </p>
            </div>
          </form>

          {/* 履歴パネル（オーバーレイ） */}
          <ChatHistoryPanel
            open={historyOpen}
            activeSessionId={activeSessionId}
            onClose={() => setHistoryOpen(false)}
            onSelectSession={(id) => {
              setHistoryOpen(false);
              void loadSession(id);
            }}
            onAfterDeleteAll={() => {
              startNewSession();
            }}
          />
        </div>
      )}
    </>
  );
}

function EmptyState({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-6 px-2">
      {/* 大きなロゴアイコン */}
      <div
        style={CHAT_GRADIENT_STYLE}
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-3"
      >
        <span
          className="text-3xl font-bold leading-none text-white drop-shadow"
          style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
        >
          M
        </span>
      </div>
      <h3
        className="text-base font-semibold text-gray-800"
        style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
      >
        こんにちは！
      </h3>
      <p className="text-xs text-gray-500 mt-1 mb-5">
        Miroku の使い方について何でもお聞きください
      </p>

      <div className="w-full space-y-2">
        <p className="text-[11px] text-gray-400 mb-1.5 text-left px-1">
          こんな質問ができます
        </p>
        <SuggestionChip onSelect={onSelect}>
          速報の動画を変えるには？
        </SuggestionChip>
        <SuggestionChip onSelect={onSelect}>
          メンバーの一括登録方法を教えて
        </SuggestionChip>
        <SuggestionChip onSelect={onSelect}>入力担当者って何？</SuggestionChip>
        <SuggestionChip onSelect={onSelect}>
          目標を設定する手順は？
        </SuggestionChip>
      </div>
    </div>
  );
}

function SuggestionChip({
  children,
  onSelect,
}: {
  children: string;
  onSelect: (s: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(children)}
      className="group block w-full text-left text-xs text-gray-700 bg-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-pink-50 border border-gray-200 hover:border-pink-200 rounded-2xl px-4 py-2.5 transition-all hover:shadow-sm hover:scale-[1.02]"
    >
      <span className="inline-flex items-center gap-2">
        <span className="text-pink-500 group-hover:text-pink-600 transition-colors">
          ✨
        </span>
        {children}
      </span>
    </button>
  );
}

function AssistantAvatar() {
  return (
    <div
      style={CHAT_GRADIENT_STYLE}
      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
    >
      <span
        className="text-xs font-bold text-white leading-none"
        style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
      >
        M
      </span>
    </div>
  );
}

function MessageBubble({
  role,
  content,
}: {
  role: 'user' | 'model';
  content: string;
}) {
  const isUser = role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end animate-chat-msg-slide-in">
        <div className="max-w-[80%] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap wrap-break-word shadow-md">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2 animate-chat-msg-slide-in group/msg">
      <AssistantAvatar />
      <div className="relative max-w-[80%] bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm wrap-break-word shadow-sm border border-gray-100">
        <RenderMarkdownLite content={content} />
        {content.trim() !== '' && <CopyButton text={content} />}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API が使えない環境は無視
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'コピーしました' : '回答をコピー'}
      title={copied ? 'コピーしました' : '回答をコピー'}
      className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-opacity"
    >
      {copied ? (
        <svg
          className="w-3 h-3 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * 軽量な Markdown レンダラ。
 * - 見出し ##, ###（フォントサイズ・色変更）
 * - 水平線 ---
 * - 箇条書き行頭 -, *
 * - インライン: **太字**, [リンク](url)
 * - 連続改行は段落として、単独改行は <br /> として表現
 */
function RenderMarkdownLite({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => {
        if (block.type === 'h2') {
          return (
            <h3
              key={i}
              className="text-sm font-bold text-gray-900 mt-2 first:mt-0"
            >
              <InlineRenderer text={block.text} />
            </h3>
          );
        }
        if (block.type === 'h3') {
          return (
            <h4
              key={i}
              className="text-xs font-semibold text-gray-700 mt-1.5 first:mt-0"
            >
              <InlineRenderer text={block.text} />
            </h4>
          );
        }
        if (block.type === 'hr') {
          return <hr key={i} className="border-gray-200 my-1" />;
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="list-disc pl-5 space-y-0.5">
              {block.items.map((item, j) => (
                <li key={j}>
                  <InlineRenderer text={item} />
                </li>
              ))}
            </ul>
          );
        }
        // paragraph
        return (
          <p key={i} className="whitespace-pre-wrap">
            <InlineRenderer text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'hr' }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }
    const h3Match = line.match(/^###\s+(.*)$/);
    const h2Match = line.match(/^##\s+(.*)$/);
    const hrMatch = /^---+\s*$/.test(line);
    const listMatch = line.match(/^[-*]\s+(.*)$/);

    if (h3Match) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: h3Match[1] });
    } else if (h2Match) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: h2Match[1] });
    } else if (hrMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'hr' });
    } else if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function InlineRenderer({ text }: { text: string }) {
  const tokens = parseInline(text);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.type === 'text') return <span key={i}>{t.value}</span>;
        if (t.type === 'bold') return <strong key={i}>{t.value}</strong>;
        if (t.type === 'link') {
          const isExternal = /^https?:\/\//.test(t.url);
          if (isExternal) {
            return (
              <a
                key={i}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 underline decoration-pink-300 hover:text-pink-700 hover:decoration-pink-500 transition-colors"
              >
                {t.value}
              </a>
            );
          }
          return (
            <Link
              key={i}
              href={t.url}
              className="text-pink-600 underline decoration-pink-300 hover:text-pink-700 hover:decoration-pink-500 transition-colors font-medium"
            >
              {t.value}
            </Link>
          );
        }
        return null;
      })}
    </>
  );
}

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'link'; value: string; url: string };

const PATTERN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Markdown リンク化されなかった素のパス表現（括弧書き）を非表示にする。
 * - 半角括弧: `(/path)` `(/path?x=y)`
 * - 全角括弧: `（/path）` `（/path?x=y）`
 * URL は表示しないポリシーのため、括弧ごと除去する。
 */
const RAW_PATH_IN_PARENS = /[(（]\s*\/[a-zA-Z0-9/_\-?=&%.#]*\s*[)）]/g;

function stripRawPathInParens(text: string): string {
  return text.replace(RAW_PATH_IN_PARENS, '');
}

function parseInline(text: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(PATTERN)) {
    const start = m.index ?? 0;
    if (start > last) {
      tokens.push({
        type: 'text',
        value: stripRawPathInParens(text.slice(last, start)),
      });
    }
    if (m[1] !== undefined) {
      tokens.push({ type: 'bold', value: m[1] });
    } else if (m[2] !== undefined && m[3] !== undefined) {
      tokens.push({ type: 'link', value: m[2], url: m[3] });
    }
    last = start + m[0].length;
  }
  if (last < text.length) {
    tokens.push({
      type: 'text',
      value: stripRawPathInParens(text.slice(last)),
    });
  }
  return tokens;
}

function Dot({ delay, color }: { delay: number; color: string }) {
  return (
    <span
      className="animate-chat-dot-bounce inline-block w-2 h-2 rounded-full"
      style={{ animationDelay: `${delay}ms`, backgroundColor: color }}
    />
  );
}
