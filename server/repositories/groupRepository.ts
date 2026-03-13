import { prisma } from '@/lib/prisma';

export const groupRepository = {
  findAll(tenantId: number) {
    return prisma.group.findMany({
      where: { tenantId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { startMonth: 'desc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  },

  findById(id: number, tenantId: number) {
    return prisma.group.findFirst({
      where: { id, tenantId },
      include: {
        members: {
          select: { userId: true, startMonth: true, endMonth: true },
        },
      },
    });
  },

  /** 指定月時点でグループに所属しているメンバーのuserIdを取得 */
  findMembersByMonth(groupId: number, tenantId: number, month: Date) {
    return prisma.groupMember.findMany({
      where: {
        groupId,
        tenantId,
        startMonth: { lte: month },
        OR: [{ endMonth: null }, { endMonth: { gte: month } }],
      },
      select: { userId: true },
    });
  },

  /** 指定期間内にグループに所属していたメンバーのuserIdを一括取得 */
  findMembersByDateRange(
    groupId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const rangeStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );
    const rangeEnd = new Date(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    return prisma.groupMember.findMany({
      where: {
        groupId,
        tenantId,
        startMonth: { lte: rangeEnd },
        OR: [{ endMonth: null }, { endMonth: { gte: rangeStart } }],
      },
      select: { userId: true },
    });
  },

  /** 現在所属中のメンバーを取得（endMonth が null） */
  findCurrentMembers(groupId: number, tenantId: number) {
    return prisma.groupMember.findMany({
      where: {
        groupId,
        tenantId,
        endMonth: null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  },

  /** グループの全メンバー履歴を取得 */
  findAllMemberHistory(groupId: number, tenantId: number) {
    return prisma.groupMember.findMany({
      where: { groupId, tenantId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ startMonth: 'desc' }, { userId: 'asc' }],
    });
  },

  create(tenantId: number, data: { name: string; managerId?: number }) {
    return prisma.group.create({ data: { ...data, tenantId } });
  },

  update(
    id: number,
    tenantId: number,
    data: { name?: string; managerId?: number; imageUrl?: string | null },
  ) {
    return prisma.group.updateMany({ where: { id, tenantId }, data });
  },

  delete(id: number, tenantId: number) {
    return prisma.group.deleteMany({ where: { id, tenantId } });
  },

  /** メンバーを追加（開始月を指定） */
  addMember(
    groupId: number,
    tenantId: number,
    userId: string,
    startMonth: Date,
  ) {
    return prisma.groupMember.create({
      data: { groupId, userId, tenantId, startMonth },
    });
  },

  /** メンバーの終了月を設定（異動） */
  endMembership(id: number, tenantId: number, endMonth: Date) {
    return prisma.groupMember.updateMany({
      where: { id, tenantId },
      data: { endMonth },
    });
  },

  /** メンバー所属レコードを削除 */
  removeMembership(id: number, tenantId: number) {
    return prisma.groupMember.deleteMany({
      where: { id, tenantId },
    });
  },

  /** 既存のsyncMembers: 開始月付きで同期（現在所属を一括設定） */
  async syncMembers(
    groupId: number,
    tenantId: number,
    userIds: string[],
    startMonth: Date,
  ) {
    const uniqueIds = [...new Set(userIds)];

    // 現在所属中（endMonth=null）のレコードを取得
    const currentMembers = await prisma.groupMember.findMany({
      where: { groupId, tenantId, endMonth: null },
    });
    const currentUserIds = new Set(currentMembers.map((m) => m.userId));
    const newUserIds = new Set(uniqueIds);

    // 削除対象: 新しいリストにいないメンバーの所属を終了
    const toEnd = currentMembers.filter((m) => !newUserIds.has(m.userId));
    // 追加対象: 現在所属していないメンバーを追加
    const toAdd = uniqueIds.filter((id) => !currentUserIds.has(id));

    await prisma.$transaction([
      // 終了: endMonthを設定
      ...toEnd.map((m) =>
        prisma.groupMember.update({
          where: { id: m.id },
          data: { endMonth: startMonth },
        }),
      ),
      // 追加: 新規レコード作成
      ...(toAdd.length > 0
        ? [
            prisma.groupMember.createMany({
              data: toAdd.map((userId) => ({
                groupId,
                userId,
                tenantId,
                startMonth,
              })),
            }),
          ]
        : []),
    ]);
  },
};
