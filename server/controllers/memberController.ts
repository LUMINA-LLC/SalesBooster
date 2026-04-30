import { NextRequest } from 'next/server';
import { memberService } from '../services/memberService';
import { tenantService } from '../services/tenantService';
import { auditLogService } from '../services/auditLogService';
import {
  getTenantId,
  getUserId,
  getUserRole,
  requireActiveLicense,
} from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const memberController = {
  async getAll(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');

      if (type === 'sales') {
        const data = await memberService.getSalesMembers(tenantId);
        return ApiResponse.success(data);
      }

      const data = await memberService.getAll(tenantId);
      return ApiResponse.success(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      return ApiResponse.serverError();
    }
  },

  async create(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const {
        name,
        email,
        password,
        role,
        isOperator,
        imageUrl,
        departmentId,
      } = body;

      if (!name || !email || !password) {
        return ApiResponse.badRequest('name, email and password are required');
      }

      if (password.length < 8) {
        return ApiResponse.badRequest(
          'パスワードは8文字以上で入力してください',
        );
      }

      // メンバー数上限チェック（入力担当者はカウント対象外）
      if (!isOperator && role !== 'ADMIN') {
        const limit = await tenantService.checkMemberLimit(tenantId);
        if (!limit.allowed) {
          return ApiResponse.badRequest(
            `メンバー数の上限（${limit.maxMembers}名）に達しています。現在${limit.currentCount}名登録中です。`,
          );
        }
      }

      const member = await memberService.create(tenantId, {
        name,
        email,
        password,
        role,
        isOperator: isOperator ?? false,
        imageUrl,
        departmentId,
      });

      auditLogService
        .create(tenantId, {
          request,
          action: 'USER_CREATE',
          detail: `ユーザー「${name}」(${email})を作成`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.created(member);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to create member');
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const member = await memberService.update(tenantId, id, body);

      auditLogService
        .create(tenantId, {
          request,
          action: 'USER_UPDATE',
          detail: `ユーザーID:${id}の情報を更新`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(member);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update member');
    }
  },

  async delete(request: NextRequest, id: string) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      await memberService.delete(tenantId, id);

      auditLogService
        .create(tenantId, {
          request,
          action: 'USER_DELETE',
          detail: `ユーザーID:${id}を削除`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete member');
    }
  },

  async changePassword(request: NextRequest, id: string) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const actorId = await getUserId(request);
      const actorRole = await getUserRole(request);

      // ADMIN または SUPER_ADMIN のみ実行可能
      if (actorRole !== 'ADMIN' && actorRole !== 'SUPER_ADMIN') {
        return ApiResponse.forbidden('管理者権限が必要です');
      }

      const target = await memberService.getById(tenantId, id);
      if (!target) {
        return ApiResponse.notFound('対象のメンバーが見つかりません');
      }

      // 自分以下のロールのみ変更可能（ADMIN は USER または自分自身のみ）
      if (actorRole === 'ADMIN') {
        const isSelf = actorId === id;
        const isLowerRole = target.role === 'USER';
        if (!isSelf && !isLowerRole) {
          return ApiResponse.forbidden(
            '他の管理者のパスワードは変更できません',
          );
        }
      }

      const body = await request.json();
      const { password } = body;

      if (!password || typeof password !== 'string') {
        return ApiResponse.badRequest('password is required');
      }
      if (password.length < 8) {
        return ApiResponse.badRequest(
          'パスワードは8文字以上で入力してください',
        );
      }

      await memberService.changePassword(tenantId, id, password);

      const isSelf = actorId === id;
      auditLogService
        .create(tenantId, {
          request,
          action: 'USER_PASSWORD_CHANGE',
          detail: isSelf
            ? `自身のパスワードを変更`
            : `ユーザーID:${id}（${target.name}）のパスワードを変更`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to change password');
    }
  },

  async importMembers(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const { members } = body;

      if (!Array.isArray(members) || members.length === 0) {
        return ApiResponse.badRequest('members array is required');
      }

      // メンバー数上限チェック（管理者・入力担当者はカウント対象外）
      const isOperator = members[0]?.isOperator ?? false;
      const role = members[0]?.role ?? 'USER';
      if (!isOperator && role !== 'ADMIN') {
        const limit = await tenantService.checkMemberLimit(
          tenantId,
          members.length,
        );
        if (!limit.allowed) {
          return ApiResponse.badRequest(
            `メンバー数の上限（${limit.maxMembers}名）を超えます。現在${limit.currentCount}名登録中、インポート${members.length}名。`,
          );
        }
      }

      const results = await memberService.importMembers(tenantId, members);

      auditLogService
        .create(tenantId, {
          request,
          action: 'USER_CREATE',
          detail: `ユーザー一括インポート: ${results.created}件追加, ${results.errors.length}件エラー`,
        })
        .catch((err) => console.error('Audit log failed:', err));

      return ApiResponse.success(results);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to import members');
    }
  },
};
