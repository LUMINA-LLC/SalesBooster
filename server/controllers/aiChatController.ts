import { NextRequest } from 'next/server';
import {
  getUserId,
  getTenantId,
  requireActiveLicense,
} from '@/server/lib/auth';
import { streamChatReply, ChatMessage } from '@/server/services/aiChatService';
import { aiChatHistoryService } from '@/server/services/aiChatHistoryService';
import { consume } from '@/lib/aiChat/rateLimiter';
import { ApiResponse } from '@/server/lib/apiResponse';

interface ChatRequestBody {
  message: string;
  sessionId?: number | null;
  history?: ChatMessage[];
}

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 2000;

/** AI API のエラーをユーザー向けの簡潔なメッセージに変換する */
function toUserFriendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/429|quota|rate.?limit|too many requests/i.test(message)) {
    return 'AIサポートが混み合っています。少し時間を置いてから再度お試しください。';
  }
  if (/401|403|api.?key|unauthorized|forbidden/i.test(message)) {
    return 'AIサポートへの接続設定に問題があります。管理者にお問い合わせください。';
  }
  if (/404|not found/i.test(message)) {
    return 'AIサポートが利用できません。管理者にお問い合わせください。';
  }
  if (/safety|blocked/i.test(message)) {
    return 'この内容には回答できません。質問の表現を変えてお試しください。';
  }
  if (/timeout|aborted|network|fetch failed/i.test(message)) {
    return 'AIサポートへの接続でタイムアウトが発生しました。少し時間を置いてお試しください。';
  }
  return 'AIサポートの応答の取得に失敗しました。少し時間を置いてお試しください。';
}

async function resolveAuthContext(
  request: NextRequest,
): Promise<{ userId: string; tenantId: number } | null> {
  try {
    const userId = await getUserId(request);
    const tenantId = await getTenantId(request);
    return { userId, tenantId };
  } catch {
    return null;
  }
}

export const aiChatController = {
  /** メッセージ送信 + ストリーミング応答 + DB 保存 */
  async chat(request: NextRequest): Promise<Response> {
    const auth = await resolveAuthContext(request);
    if (!auth) return new Response('Unauthorized', { status: 401 });

    try {
      await requireActiveLicense(request);
    } catch (error) {
      return ApiResponse.fromError(error, 'License required');
    }

    const limit = consume(`chat:${auth.userId}`);
    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error:
            'リクエスト回数の上限に達しました。少し時間を置いてからお試しください。',
          retryAfterMs: limit.retryAfterMs,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const message = (body.message ?? '').trim();
    if (!message) return new Response('Message is required', { status: 400 });
    if (message.length > MAX_MESSAGE_LENGTH)
      return new Response('Message too long', { status: 400 });

    const history = (body.history ?? [])
      .slice(-MAX_HISTORY)
      .filter(
        (m) =>
          (m.role === 'user' || m.role === 'model') &&
          typeof m.content === 'string' &&
          m.content.length > 0,
      );

    // セッション解決 + ユーザーメッセージを保存
    let sessionId: number;
    let isFirstMessage = false;
    try {
      sessionId = await aiChatHistoryService.resolveSession({
        userId: auth.userId,
        tenantId: auth.tenantId,
        sessionId: body.sessionId ?? null,
      });
      // タイトル設定用に「新規セッションかつ history が空＝最初のメッセージ」を判定
      isFirstMessage = history.length === 0;
      await aiChatHistoryService.appendUserMessage(sessionId, message);
      if (isFirstMessage) {
        aiChatHistoryService
          .setSessionTitleFromMessage(sessionId, message)
          .catch((err) => console.error('Failed to set session title:', err));
      }
    } catch (err) {
      console.error('Failed to persist user message:', err);
      return new Response('履歴の保存に失敗しました', { status: 500 });
    }

    const encoder = new TextEncoder();
    const abortController = new AbortController();
    request.signal.addEventListener('abort', () => abortController.abort());

    let assembled = ''; // ストリーミング全文を集約して、最後にまとめて DB へ保存

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamChatReply(
            history,
            message,
            abortController.signal,
          )) {
            assembled += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          console.error('AI chat error:', err);
          const userMessage = toUserFriendlyError(err);
          const errorTail = `\n\n[エラー] ${userMessage}`;
          assembled += errorTail;
          try {
            controller.enqueue(encoder.encode(errorTail));
          } catch {
            // ignore
          }
          controller.close();
        } finally {
          // ストリーミング完了/中断/エラー時いずれも、現時点までの応答を保存
          if (assembled.trim().length > 0) {
            aiChatHistoryService
              .appendModelMessage(sessionId, assembled)
              .catch((err) =>
                console.error('Failed to persist model message:', err),
              );
          }
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
        'X-AI-Chat-Session-Id': String(sessionId),
        // CORS で読めるようにヘッダ公開
        'Access-Control-Expose-Headers': 'X-AI-Chat-Session-Id',
      },
    });
  },

  /** ユーザーのセッション一覧 */
  async listSessions(request: NextRequest): Promise<Response> {
    const auth = await resolveAuthContext(request);
    if (!auth) return new Response('Unauthorized', { status: 401 });

    try {
      const sessions = await aiChatHistoryService.listSessions(
        auth.userId,
        auth.tenantId,
      );
      return ApiResponse.success({ sessions });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to list AI chat sessions');
    }
  },

  /** セッション詳細（メッセージ込み） */
  async getSession(request: NextRequest, sessionId: number): Promise<Response> {
    const auth = await resolveAuthContext(request);
    if (!auth) return new Response('Unauthorized', { status: 401 });
    if (!Number.isFinite(sessionId)) {
      return ApiResponse.badRequest('sessionId is invalid');
    }

    try {
      const session = await aiChatHistoryService.getSession(
        sessionId,
        auth.userId,
        auth.tenantId,
      );
      if (!session) return ApiResponse.notFound('セッションが見つかりません');
      return ApiResponse.success({
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messages: session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        },
      });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to get AI chat session');
    }
  },

  /** セッション削除 */
  async deleteSession(
    request: NextRequest,
    sessionId: number,
  ): Promise<Response> {
    const auth = await resolveAuthContext(request);
    if (!auth) return new Response('Unauthorized', { status: 401 });
    if (!Number.isFinite(sessionId)) {
      return ApiResponse.badRequest('sessionId is invalid');
    }

    try {
      await aiChatHistoryService.deleteSession(
        sessionId,
        auth.userId,
        auth.tenantId,
      );
      return ApiResponse.success({ ok: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete AI chat session');
    }
  },

  /** ユーザーの全セッション削除 */
  async deleteAllSessions(request: NextRequest): Promise<Response> {
    const auth = await resolveAuthContext(request);
    if (!auth) return new Response('Unauthorized', { status: 401 });

    try {
      await aiChatHistoryService.deleteAllForUser(auth.userId, auth.tenantId);
      return ApiResponse.success({ ok: true });
    } catch (error) {
      return ApiResponse.fromError(
        error,
        'Failed to delete all AI chat sessions',
      );
    }
  },
};
