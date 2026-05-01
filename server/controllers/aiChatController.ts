import { NextRequest } from 'next/server';
import { getUserId } from '@/server/lib/auth';
import { streamChatReply, ChatMessage } from '@/server/services/aiChatService';
import { consume } from '@/lib/aiChat/rateLimiter';

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 2000;

/**
 * AI API のエラーをユーザー向けの簡潔なメッセージに変換する。
 * 開発時のデバッグ用に詳細を console.error で残す。
 */
function toUserFriendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/429|quota|rate.?limit|too many requests/i.test(message)) {
    return 'AI が混み合っています。少し時間を置いてから再度お試しください。';
  }
  if (/401|403|api.?key|unauthorized|forbidden/i.test(message)) {
    return 'AI サービスへの接続設定に問題があります。管理者にお問い合わせください。';
  }
  if (/404|not found/i.test(message)) {
    return 'AI モデルが利用できません。管理者にお問い合わせください。';
  }
  if (/safety|blocked/i.test(message)) {
    return 'この内容には回答できません。質問の表現を変えてお試しください。';
  }
  if (/timeout|aborted|network|fetch failed/i.test(message)) {
    return 'AI への接続でタイムアウトが発生しました。少し時間を置いてお試しください。';
  }
  return 'AI 応答の取得に失敗しました。少し時間を置いてお試しください。';
}

export const aiChatController = {
  async chat(request: NextRequest): Promise<Response> {
    let userId: string;
    try {
      userId = await getUserId(request);
    } catch {
      return new Response('Unauthorized', { status: 401 });
    }

    const limit = consume(`chat:${userId}`);
    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error:
            'リクエスト回数の上限に達しました。少し時間を置いてからお試しください。',
          retryAfterMs: limit.retryAfterMs,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const message = (body.message ?? '').trim();
    if (!message) {
      return new Response('Message is required', { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response('Message too long', { status: 400 });
    }

    const history = (body.history ?? [])
      .slice(-MAX_HISTORY)
      .filter(
        (m) =>
          (m.role === 'user' || m.role === 'model') &&
          typeof m.content === 'string' &&
          m.content.length > 0,
      );

    const encoder = new TextEncoder();
    const abortController = new AbortController();
    // クライアント側が接続を切ったら生成を中断する
    request.signal.addEventListener('abort', () => abortController.abort());

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamChatReply(
            history,
            message,
            abortController.signal,
          )) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          console.error('AI chat error:', err);
          const userMessage = toUserFriendlyError(err);
          try {
            controller.enqueue(encoder.encode(`\n\n[エラー] ${userMessage}`));
          } catch {
            // ignore
          }
          controller.close();
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  },
};
