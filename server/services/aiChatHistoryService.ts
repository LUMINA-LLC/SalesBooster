import { aiChatRepository } from '@/server/repositories/aiChatRepository';
import { AiChatRole } from '@prisma/client';

/** セッションの自動継続を判断する閾値（最終更新からこの時間以上経過すると新規セッションを開く） */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30分

/** 履歴の自動保存期間（これより古いセッションは削除対象） */
const RETENTION_DAYS = 90;

/** タイトル自動生成時の最大文字数 */
const TITLE_MAX_LENGTH = 40;

export const aiChatHistoryService = {
  /**
   * メッセージ送信時に使用する「保存先セッション」を取得または作成する。
   * - 既存セッションが指定されればそれを再利用
   * - なければ最新セッションが SESSION_TIMEOUT_MS 以内なら継続、それ以外は新規作成
   */
  async resolveSession(params: {
    userId: string;
    tenantId: number;
    sessionId?: number | null;
  }): Promise<number> {
    const { userId, tenantId, sessionId } = params;

    if (sessionId) {
      const found = await aiChatRepository.findSessionWithMessages(
        sessionId,
        userId,
        tenantId,
      );
      if (found) return found.id;
    }

    const latest = await aiChatRepository.findLatestSessionForUser(
      userId,
      tenantId,
    );
    if (latest) {
      const elapsed = Date.now() - latest.updatedAt.getTime();
      if (elapsed < SESSION_TIMEOUT_MS) {
        return latest.id;
      }
    }

    const created = await aiChatRepository.createSession({ userId, tenantId });
    return created.id;
  },

  /** ユーザーメッセージの追加 */
  async appendUserMessage(sessionId: number, content: string) {
    await aiChatRepository.appendMessage({
      sessionId,
      role: 'user' as AiChatRole,
      content,
    });
  },

  /** AI 応答の追加 */
  async appendModelMessage(sessionId: number, content: string) {
    await aiChatRepository.appendMessage({
      sessionId,
      role: 'model' as AiChatRole,
      content,
    });
  },

  /** セッションのタイトルを最初のユーザーメッセージから自動設定 */
  async setSessionTitleFromMessage(sessionId: number, message: string) {
    const trimmed = message.trim().replace(/\s+/g, ' ');
    const title =
      trimmed.length > TITLE_MAX_LENGTH
        ? `${trimmed.slice(0, TITLE_MAX_LENGTH)}…`
        : trimmed;
    if (title.length === 0) return;
    await aiChatRepository.updateSessionTitle(sessionId, title);
  },

  /** ユーザーのセッション一覧 */
  listSessions(userId: string, tenantId: number, limit = 50) {
    return aiChatRepository.findSessionsByUser(userId, tenantId, limit);
  },

  /** セッション詳細（メッセージ込み） */
  getSession(sessionId: number, userId: string, tenantId: number) {
    return aiChatRepository.findSessionWithMessages(
      sessionId,
      userId,
      tenantId,
    );
  },

  /** セッション削除 */
  deleteSession(sessionId: number, userId: string, tenantId: number) {
    return aiChatRepository.deleteSession(sessionId, userId, tenantId);
  },

  /** ユーザーの全セッション削除 */
  deleteAllForUser(userId: string, tenantId: number) {
    return aiChatRepository.deleteAllSessionsForUser(userId, tenantId);
  },

  /** 90日経過した履歴を削除（バッチ実行用） */
  async pruneExpired() {
    const before = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    return aiChatRepository.deleteOlderThan(before);
  },
};
