import { NextRequest } from 'next/server';
import { groupService } from '../services/groupService';
import { auditLogService } from '../services/auditLogService';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const groupController = {
  async getAll(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const data = await groupService.getAll(tenantId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return ApiResponse.serverError();
    }
  },

  async create(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { name, managerId } = body;

      if (!name) {
        return ApiResponse.badRequest('name is required');
      }

      const group = await groupService.create(tenantId, { name, managerId });

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_CREATE',
          detail: `グループ「${name}」を作成`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(group);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to create group');
    }
  },

  async update(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const group = await groupService.update(tenantId, id, body);

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_UPDATE',
          detail: `グループID:${id}の情報を更新`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(group);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update group');
    }
  },

  async delete(request: NextRequest, id: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      await groupService.delete(tenantId, id);

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_DELETE',
          detail: `グループID:${id}を削除`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete group');
    }
  },

  async syncMembers(request: NextRequest, groupId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { memberIds, startMonth } = body;

      if (!Array.isArray(memberIds)) {
        return ApiResponse.badRequest('memberIds must be an array');
      }

      const userIds = memberIds.map((id: string | number) => String(id));
      const month = startMonth ? new Date(startMonth) : undefined;
      await groupService.syncMembers(tenantId, groupId, userIds, month);

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_SYNC_MEMBERS',
          detail: `グループID:${groupId}のメンバーを同期（${userIds.length}名）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to sync group members');
    }
  },

  /** メンバー履歴取得 */
  async getMemberHistory(request: NextRequest, groupId: number) {
    try {
      const tenantId = await getTenantId(request);
      const history = await groupService.getMemberHistory(tenantId, groupId);
      return ApiResponse.success(history);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch member history');
    }
  },

  /** メンバー追加（開始月指定、任意で終了月指定） */
  async addMember(request: NextRequest, groupId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { userId, startMonth, endMonth } = body;

      if (!userId || !startMonth) {
        return ApiResponse.badRequest('userId and startMonth are required');
      }

      const result = await groupService.addMember(
        tenantId,
        groupId,
        String(userId),
        new Date(startMonth),
        endMonth ? new Date(endMonth) : null,
      );

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_ADD_MEMBER',
          detail: endMonth
            ? `グループID:${groupId}にメンバー(${userId})を追加（期間:${startMonth}〜${endMonth}）`
            : `グループID:${groupId}にメンバー(${userId})を追加（開始:${startMonth}）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(result);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to add member');
    }
  },

  /** メンバーシップの開始月・終了月を任意に更新 */
  async updateMembershipPeriod(request: NextRequest, groupId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { membershipId, startMonth, endMonth } = body;

      if (!membershipId) {
        return ApiResponse.badRequest('membershipId is required');
      }

      await groupService.updateMembershipPeriod(
        tenantId,
        Number(membershipId),
        {
          ...(startMonth ? { startMonth: new Date(startMonth) } : {}),
          ...(endMonth !== undefined
            ? { endMonth: endMonth ? new Date(endMonth) : null }
            : {}),
        },
      );

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_UPDATE',
          detail: `グループID:${groupId}のメンバー所属(${membershipId})の期間を更新`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update membership period');
    }
  },

  /** メンバー所属終了（異動） */
  async endMembership(request: NextRequest, groupId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { membershipId, endMonth } = body;

      if (!membershipId || !endMonth) {
        return ApiResponse.badRequest('membershipId and endMonth are required');
      }

      await groupService.endMembership(
        tenantId,
        Number(membershipId),
        new Date(endMonth),
      );

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_END_MEMBERSHIP',
          detail: `グループID:${groupId}のメンバー所属(${membershipId})を終了（終了:${endMonth}）`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to end membership');
    }
  },

  /** メンバー所属レコード削除 */
  async removeMembership(request: NextRequest, groupId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { membershipId } = body;

      if (!membershipId) {
        return ApiResponse.badRequest('membershipId is required');
      }

      await groupService.removeMembership(tenantId, Number(membershipId));

      auditLogService
        .create(tenantId, {
          request,
          action: 'GROUP_REMOVE_MEMBERSHIP',
          detail: `グループID:${groupId}のメンバー所属(${membershipId})を削除`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to remove membership');
    }
  },
};
