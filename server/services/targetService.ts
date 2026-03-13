import { targetRepository } from '../repositories/targetRepository';
import { groupTargetRepository } from '../repositories/groupTargetRepository';

export const targetService = {
  async getAll(tenantId: number) {
    const targets = await targetRepository.findAll(tenantId);
    return targets.map((t) => ({
      id: t.id,
      userId: t.userId,
      memberName: t.user.name,
      value: t.value,
      year: t.year,
      month: t.month,
      dataTypeId: t.dataTypeId,
    }));
  },

  async upsert(
    tenantId: number,
    data: {
      userId: string;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    },
  ) {
    return targetRepository.upsert(tenantId, data);
  },

  async getByYear(tenantId: number, year: number, dataTypeId?: number) {
    const targets = await targetRepository.findByYearAndDataType(
      tenantId,
      year,
      dataTypeId,
    );
    // Transform into { userId: { month: value } } map
    const result: Record<
      string,
      { userName: string; months: Record<number, number> }
    > = {};
    for (const t of targets) {
      if (!result[t.userId]) {
        result[t.userId] = { userName: t.user.name ?? '', months: {} };
      }
      result[t.userId].months[t.month] = t.value;
    }
    return result;
  },

  async bulkUpsert(
    tenantId: number,
    targets: {
      userId: string;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    }[],
  ) {
    return targetRepository.bulkUpsert(tenantId, targets);
  },

  async getGroupTargetsByYear(
    tenantId: number,
    year: number,
    dataTypeId?: number,
  ) {
    const targets = await groupTargetRepository.findByYearAndDataType(
      tenantId,
      year,
      dataTypeId,
    );
    const result: Record<
      number,
      { groupName: string; months: Record<number, number> }
    > = {};
    for (const t of targets) {
      if (!result[t.groupId]) {
        result[t.groupId] = { groupName: t.group.name, months: {} };
      }
      result[t.groupId].months[t.month] = t.value;
    }
    return result;
  },

  async upsertGroupTarget(
    tenantId: number,
    data: {
      groupId: number;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    },
  ) {
    return groupTargetRepository.upsert(tenantId, data);
  },

  async bulkUpsertGroupTargets(
    tenantId: number,
    targets: {
      groupId: number;
      value: number;
      year: number;
      month: number;
      dataTypeId?: number;
    }[],
  ) {
    return groupTargetRepository.bulkUpsert(tenantId, targets);
  },
};
