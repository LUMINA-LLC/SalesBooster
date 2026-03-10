import { hash } from 'bcryptjs';
import { superAdminRepository } from '../repositories/superAdminRepository';

export const superAdminService = {
  async getAll() {
    return superAdminRepository.findAll();
  },

  async create(data: { email: string; password: string; name?: string }) {
    const existing = await superAdminRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('DUPLICATE_EMAIL');
    }

    const hashedPassword = await hash(data.password, 12);
    return superAdminRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name || null,
    });
  },

  async update(id: string, data: { email?: string; password?: string; name?: string; status?: string }) {
    const existing = await superAdminRepository.findById(id);
    if (!existing) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    const updateData: Record<string, unknown> = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password) {
      updateData.password = await hash(data.password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('NO_UPDATE_DATA');
    }

    return superAdminRepository.update(id, updateData);
  },

  async delete(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error('CANNOT_DELETE_SELF');
    }

    const existing = await superAdminRepository.findById(id);
    if (!existing) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    await superAdminRepository.delete(id);
  },

  async getAuditLogs(options: {
    page: number;
    limit: number;
    tenantId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const skip = (options.page - 1) * options.limit;

    const [logs, total] = await Promise.all([
      superAdminRepository.findAllAuditLogs({
        skip,
        take: options.limit,
        tenantId: options.tenantId,
        action: options.action,
        startDate: options.startDate,
        endDate: options.endDate,
      }),
      superAdminRepository.countAuditLogs({
        tenantId: options.tenantId,
        action: options.action,
        startDate: options.startDate,
        endDate: options.endDate,
      }),
    ]);

    return {
      data: logs,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  },
};
