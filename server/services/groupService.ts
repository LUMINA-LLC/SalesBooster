import { groupRepository } from '../repositories/groupRepository';

export const groupService = {
  async getAll(tenantId: number) {
    const groups = await groupRepository.findAll(tenantId);
    return groups.map((g) => {
      // 現在所属中のメンバー（endMonth が null）のみカウント
      const currentMembers = g.members.filter((gm) => gm.endMonth === null);
      return {
        id: g.id,
        name: g.name,
        imageUrl: g.imageUrl,
        managerId: g.managerId,
        members: currentMembers.length,
        memberList: currentMembers.map((gm) => ({
          id: gm.user.id,
          name: gm.user.name,
        })),
      };
    });
  },

  async getById(tenantId: number, id: number) {
    return groupRepository.findById(id, tenantId);
  },

  /** 指定月時点でグループに所属しているメンバーのuserIdリストを返す */
  async getMemberIdsByMonth(
    tenantId: number,
    groupId: number,
    month: Date,
  ): Promise<string[]> {
    const members = await groupRepository.findMembersByMonth(
      groupId,
      tenantId,
      month,
    );
    return members.map((m) => m.userId);
  },

  /** 指定期間内にグループに所属していたメンバーのuserIdリストを一括返却 */
  async getMemberIdsByDateRange(
    tenantId: number,
    groupId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<string[]> {
    const members = await groupRepository.findMembersByDateRange(
      groupId,
      tenantId,
      startDate,
      endDate,
    );
    return [...new Set(members.map((m) => m.userId))];
  },

  /** 現在所属中のメンバーのuserIdリストを返す */
  async getCurrentMemberIds(
    tenantId: number,
    groupId: number,
  ): Promise<string[]> {
    const members = await groupRepository.findCurrentMembers(groupId, tenantId);
    return members.map((m) => m.user.id);
  },

  /** グループの全メンバー履歴を返す */
  async getMemberHistory(tenantId: number, groupId: number) {
    return groupRepository.findAllMemberHistory(groupId, tenantId);
  },

  async create(tenantId: number, data: { name: string; managerId?: number }) {
    return groupRepository.create(tenantId, data);
  },

  async update(
    tenantId: number,
    id: number,
    data: { name?: string; managerId?: number; imageUrl?: string | null },
  ) {
    await groupRepository.update(id, tenantId, data);
    return groupRepository.findById(id, tenantId);
  },

  async delete(tenantId: number, id: number) {
    const existing = await groupRepository.findById(id, tenantId);
    if (!existing) return null;
    await groupRepository.delete(id, tenantId);
    return existing;
  },

  async syncMembers(
    tenantId: number,
    groupId: number,
    userIds: string[],
    startMonth?: Date,
  ) {
    const month =
      startMonth ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return groupRepository.syncMembers(groupId, tenantId, userIds, month);
  },

  async addMember(
    tenantId: number,
    groupId: number,
    userId: string,
    startMonth: Date,
  ) {
    return groupRepository.addMember(groupId, tenantId, userId, startMonth);
  },

  async endMembership(tenantId: number, membershipId: number, endMonth: Date) {
    return groupRepository.endMembership(membershipId, tenantId, endMonth);
  },

  async removeMembership(tenantId: number, membershipId: number) {
    return groupRepository.removeMembership(membershipId, tenantId);
  },
};
