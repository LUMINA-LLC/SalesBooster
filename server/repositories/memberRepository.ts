import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

export const memberRepository = {
  findAll(tenantId: number) {
    return prisma.user.findMany({
      where: { tenantId, role: { not: 'SUPER_ADMIN' } },
      include: { department: true },
      orderBy: { createdAt: 'asc' },
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
      imageUrl?: string;
      departmentId?: number | null;
    },
  ) {
    return prisma.user.updateMany({ where: { id, tenantId }, data });
  },

  delete(id: string, tenantId: number) {
    return prisma.user.deleteMany({ where: { id, tenantId } });
  },
};
