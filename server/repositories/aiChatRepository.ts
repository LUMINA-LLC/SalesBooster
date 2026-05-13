import { prisma } from '@/lib/prisma';
import { AiChatRole } from '@prisma/client';

export const aiChatRepository = {
  /** ユーザーのセッション一覧（最新順） */
  findSessionsByUser(userId: string, tenantId: number, limit = 50) {
    return prisma.aiChatSession.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  },

  /** セッション詳細（メッセージ込み）。テナント・ユーザー制約あり */
  findSessionWithMessages(sessionId: number, userId: string, tenantId: number) {
    return prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId, tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  },

  /** セッションの最新更新時刻と メッセージ数 を取得（セッション継続判定用） */
  findLatestSessionForUser(userId: string, tenantId: number) {
    return prisma.aiChatSession.findFirst({
      where: { userId, tenantId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, updatedAt: true },
    });
  },

  /** セッション新規作成 */
  createSession(data: { userId: string; tenantId: number; title?: string }) {
    return prisma.aiChatSession.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        title: data.title ?? null,
      },
      select: { id: true, createdAt: true, updatedAt: true },
    });
  },

  /** メッセージ追加 + セッションの updatedAt 更新 */
  async appendMessage(data: {
    sessionId: number;
    role: AiChatRole;
    content: string;
  }) {
    const [message] = await prisma.$transaction([
      prisma.aiChatMessage.create({
        data: {
          sessionId: data.sessionId,
          role: data.role,
          content: data.content,
        },
      }),
      prisma.aiChatSession.update({
        where: { id: data.sessionId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  },

  /** セッションのタイトル設定（最初のユーザーメッセージから自動生成） */
  updateSessionTitle(sessionId: number, title: string) {
    return prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { title },
      select: { id: true },
    });
  },

  /** セッション削除（メッセージは onDelete: Cascade で消える）*/
  deleteSession(sessionId: number, userId: string, tenantId: number) {
    return prisma.aiChatSession.deleteMany({
      where: { id: sessionId, userId, tenantId },
    });
  },

  /** ユーザーの全セッション削除 */
  deleteAllSessionsForUser(userId: string, tenantId: number) {
    return prisma.aiChatSession.deleteMany({
      where: { userId, tenantId },
    });
  },

  /** 指定日数より古いセッションを削除（自動削除バッチ用） */
  deleteOlderThan(beforeDate: Date) {
    return prisma.aiChatSession.deleteMany({
      where: { updatedAt: { lt: beforeDate } },
    });
  },
};
