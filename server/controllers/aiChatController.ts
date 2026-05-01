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
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamChatReply(history, message)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          console.error('AI chat error:', err);
          const errorMessage =
            err instanceof Error ? err.message : 'AI 応答の取得に失敗しました';
          try {
            controller.enqueue(encoder.encode(`\n\n[エラー] ${errorMessage}`));
          } catch {
            // ignore
          }
          controller.close();
        }
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
