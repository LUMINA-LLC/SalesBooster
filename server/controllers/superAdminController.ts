import { NextRequest } from 'next/server';
import { superAdminService } from '../services/superAdminService';
import { requireSuperAdmin, getUserId } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';

export const superAdminController = {
  // === アカウント管理 ===

  async getAllAccounts(request: NextRequest) {
    try {
      await requireSuperAdmin(request);
      const accounts = await superAdminService.getAll();
      return ApiResponse.success(accounts);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch accounts');
    }
  },

  async createAccount(request: NextRequest) {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { email, password, name } = body;

      if (!email || !password) {
        return ApiResponse.badRequest('メールアドレスとパスワードは必須です');
      }
      if (password.length < 8) {
        return ApiResponse.badRequest(
          'パスワードは8文字以上で設定してください',
        );
      }

      const account = await superAdminService.create({ email, password, name });
      return ApiResponse.created(account);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
        return ApiResponse.conflict('このメールアドレスは既に使用されています');
      }
      return ApiResponse.fromError(error, 'Failed to create account');
    }
  },

  async updateAccount(request: NextRequest, id: string) {
    try {
      await requireSuperAdmin(request);
      const body = await request.json();
      const { email, password, name, status } = body;

      if (password && password.length < 8) {
        return ApiResponse.badRequest(
          'パスワードは8文字以上で設定してください',
        );
      }

      const account = await superAdminService.update(id, {
        email,
        password,
        name,
        status,
      });
      return ApiResponse.success(account);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ACCOUNT_NOT_FOUND') {
          return ApiResponse.notFound('アカウントが見つかりません');
        }
        if (error.message === 'NO_UPDATE_DATA') {
          return ApiResponse.badRequest('更新内容がありません');
        }
      }
      return ApiResponse.fromError(error, 'Failed to update account');
    }
  },

  async deleteAccount(request: NextRequest, id: string) {
    try {
      await requireSuperAdmin(request);
      const currentUserId = await getUserId(request);
      await superAdminService.delete(id, currentUserId);
      return ApiResponse.success({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'CANNOT_DELETE_SELF') {
          return ApiResponse.badRequest('自分自身のアカウントは削除できません');
        }
        if (error.message === 'ACCOUNT_NOT_FOUND') {
          return ApiResponse.notFound('アカウントが見つかりません');
        }
      }
      return ApiResponse.fromError(error, 'Failed to delete account');
    }
  },

  // === 監査ログ ===

  async getAuditLogs(request: NextRequest) {
    try {
      await requireSuperAdmin(request);
      const { searchParams } = new URL(request.url);

      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get('limit') || '50')),
      );
      const tenantId = searchParams.get('tenantId')
        ? parseInt(searchParams.get('tenantId')!)
        : undefined;
      const action = searchParams.get('action') || undefined;
      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined;
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')! + 'T23:59:59.999Z')
        : undefined;

      const result = await superAdminService.getAuditLogs({
        page,
        limit,
        tenantId,
        action,
        startDate,
        endDate,
      });
      return ApiResponse.success(result);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to fetch audit logs');
    }
  },
};
