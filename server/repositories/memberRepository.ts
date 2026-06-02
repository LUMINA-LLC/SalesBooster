import { prisma } from '@/lib/prisma';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

/**
 * ランキング・売上集計の対象となるメンバーの共通条件。
 * 「有効（ACTIVE）な一般ユーザー（入力担当者を除く）」を表す。
 * 売上系クエリ（findSalesMembers / findSalesMembersByIds 等）で共有し、
 * 条件の散在・修正漏れを防ぐ。
 */
export const SALES_MEMBER_WHERE = {
  role: 'USER',
  isOperator: false,
  status: 'ACTIVE',
} satisfies Prisma.UserWhereInput;

export const memberRepository = {
  findAll(tenantId: number) {
    return prisma.user.findMany({
      where: { tenantId, role: { not: 'SUPER_ADMIN' } },
      include: { department: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  /** ランキング・売上対象メンバーのみ取得 */
  findSalesMembers(tenantId: number) {
    return prisma.user.findMany({
      where: { tenantId, ...SALES_MEMBER_WHERE },
      include: { department: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  /** ランキング・売上対象メンバーのみ取得（ID指定） */
  findSalesMembersByIds(ids: string[], tenantId: number) {
    return prisma.user.findMany({
      where: { id: { in: ids }, tenantId, ...SALES_MEMBER_WHERE },
      include: { department: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  /** ライセンスカウント対象メンバー数（role: USER かつ isOperator: false） */
  countLicensedMembers(tenantId: number) {
    return prisma.user.count({
      where: { tenantId, role: 'USER', isOperator: false },
    });
  },

  findByIds(ids: string[], tenantId: number) {
    return prisma.user.findMany({
      where: { id: { in: ids }, tenantId },
      include: { department: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  findById(id: string, tenantId: number) {
    return prisma.user.findFirst({
      where: { id, tenantId },
      include: { department: true },
    });
  },

  findByEmails(emails: string[], tenantId: number) {
    return prisma.user.findMany({
      where: { email: { in: emails }, tenantId },
      select: { email: true },
    });
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
    const hashedPassword = await hash(data.password, 12);
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'USER',
        isOperator: data.isOperator ?? false,
        imageUrl: data.imageUrl,
        departmentId: data.departmentId,
        tenantId,
      },
    });
  },

  update(
    id: string,
    tenantId: number,
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
    return prisma.user.updateMany({ where: { id, tenantId }, data });
  },

  delete(id: string, tenantId: number) {
    return prisma.user.deleteMany({ where: { id, tenantId } });
  },

  async updatePassword(id: string, tenantId: number, password: string) {
    const hashedPassword = await hash(password, 12);
    return prisma.user.updateMany({
      where: { id, tenantId },
      data: { password: hashedPassword },
    });
  },

  acceptTerms(id: string, tenantId: number) {
    const now = new Date();
    return prisma.user.updateMany({
      where: { id, tenantId },
      data: { termsAcceptedAt: now, privacyAcceptedAt: now },
    });
  },

  findTermsStatus(id: string, tenantId: number) {
    return prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
      },
    });
  },
};
