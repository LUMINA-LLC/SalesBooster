import { memberRepository } from '../repositories/memberRepository';
import { UserRole, UserStatus } from '@prisma/client';

export const memberService = {
  async getAll(tenantId: number) {
    const members = await memberRepository.findAll(tenantId);
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      isOperator: m.isOperator,
      imageUrl: m.imageUrl,
      department: m.department?.name || null,
      departmentId: m.departmentId,
    }));
  },

  /** データ入力対象メンバー取得（role: USER, isOperator: false） */
  async getSalesMembers(tenantId: number) {
    const members = await memberRepository.findSalesMembers(tenantId);
    return members.map((m) => ({
      id: m.id,
      name: m.name,
    }));
  },

  async getById(tenantId: number, id: string) {
    return memberRepository.findById(id, tenantId);
  },

  async create(
    tenantId: number,
    data: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      isOperator?: boolean;
      imageUrl?: string;
      departmentId?: number;
    },
  ) {
    return memberRepository.create(tenantId, {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      isOperator: data.isOperator,
      imageUrl: data.imageUrl,
      departmentId: data.departmentId,
    });
  },

  async update(
    tenantId: number,
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      status?: UserStatus;
      isOperator?: boolean;
      imageUrl?: string;
      departmentId?: number | null;
    },
  ) {
    await memberRepository.update(id, tenantId, data);
    return memberRepository.findById(id, tenantId);
  },

  async delete(tenantId: number, id: string) {
    const existing = await memberRepository.findById(id, tenantId);
    if (!existing) return null;
    await memberRepository.delete(id, tenantId);
    return existing;
  },

  async importMembers(
    tenantId: number,
    members: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      departmentId?: number;
    }[],
  ) {
    const emails = members.map((m) => m.email);
    const existing = await memberRepository.findByEmails(emails, tenantId);
    const existingEmails = new Set(existing.map((e) => e.email));

    const results: {
      created: number;
      skipped: number;
      errors: { email: string; reason: string }[];
    } = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const member of members) {
      if (existingEmails.has(member.email)) {
        results.errors.push({
          email: member.email,
          reason: '既に登録済みのメールアドレスです',
        });
        continue;
      }
      try {
        await memberRepository.create(tenantId, {
          name: member.name,
          email: member.email,
          password: member.password,
          role: member.role,
          departmentId: member.departmentId,
        });
        results.created++;
      } catch {
        results.errors.push({
          email: member.email,
          reason: '登録に失敗しました',
        });
      }
    }

    return results;
  },
};
