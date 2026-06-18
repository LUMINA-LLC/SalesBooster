import { NextRequest } from 'next/server';
import { displayService } from '../services/displayService';
import { auditLogService } from '../services/auditLogService';
import { VALID_TRANSITIONS } from '@/types/display';
import { getTenantId, requireActiveLicense } from '../lib/auth';
import { ApiResponse } from '../lib/apiResponse';
import { logger } from '@/lib/logger';

export const displayController = {
  /**
   * 設定を取得する。
   * - ?configId=X 指定: その設定（自テナントのもの）
   * - 指定なし: テナントの最初の1件（既存挙動の互換）
   */
  async getConfig(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const configIdParam = searchParams.get('configId');

      if (configIdParam) {
        const configId = Number(configIdParam);
        if (!Number.isFinite(configId)) {
          return ApiResponse.badRequest('Invalid configId');
        }
        const config = await displayService.getConfigById(tenantId, configId);
        if (!config) return ApiResponse.notFound('設定が見つかりません');
        return ApiResponse.success(config);
      }

      const config = await displayService.getConfig(tenantId);
      return ApiResponse.success(config);
    } catch (error) {
      logger.error('Failed to fetch display config', error);
      return ApiResponse.serverError();
    }
  },

  /** テナント内の設定一覧を返す。 */
  async listConfigs(request: NextRequest) {
    try {
      const tenantId = await getTenantId(request);
      const configs = await displayService.listConfigs(tenantId);
      return ApiResponse.success(configs);
    } catch (error) {
      logger.error('Failed to list display configs', error);
      return ApiResponse.serverError();
    }
  },

  /**
   * 設定を更新する。
   * - ?configId=X 指定: その設定を更新
   * - 指定なし: テナントの最初の1件を upsert（既存挙動の互換）
   */
  async updateConfig(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const { searchParams } = new URL(request.url);
      const configIdParam = searchParams.get('configId');
      const body = await request.json();

      if (!body.views || !Array.isArray(body.views)) {
        return ApiResponse.badRequest('views is required');
      }
      if (body.transition && !VALID_TRANSITIONS.includes(body.transition)) {
        return ApiResponse.badRequest('Invalid transition type');
      }

      if (configIdParam) {
        const configId = Number(configIdParam);
        if (!Number.isFinite(configId)) {
          return ApiResponse.badRequest('Invalid configId');
        }
        const ok = await displayService.updateConfigById(
          tenantId,
          configId,
          body,
        );
        if (!ok) return ApiResponse.notFound('設定が見つかりません');
      } else {
        await displayService.updateConfig(tenantId, body);
      }

      logger.info('Display config updated', { tenantId });
      auditLogService
        .create(tenantId, {
          request,
          action: 'DISPLAY_CONFIG_UPDATE',
          detail: `ディスプレイ設定を更新`,
        })
        .catch((err) => logger.error('Audit log failed', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to update display config');
    }
  },

  /** 新規設定を作成する。 */
  async createConfig(request: NextRequest) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();

      if (!body.views || !Array.isArray(body.views)) {
        return ApiResponse.badRequest('views is required');
      }

      const created = await displayService.createConfig(tenantId, body);
      auditLogService
        .create(tenantId, {
          request,
          action: 'DISPLAY_CONFIG_UPDATE',
          detail: `ディスプレイ設定「${created.name ?? ''}」を作成`,
        })
        .catch((err) => logger.error('Audit log failed', err));

      return ApiResponse.created(created);
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to create display config');
    }
  },

  /** configId 指定で設定を削除する。 */
  async deleteConfig(request: NextRequest, configId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      if (!Number.isFinite(configId)) {
        return ApiResponse.badRequest('Invalid configId');
      }
      const ok = await displayService.deleteConfig(tenantId, configId);
      if (!ok) return ApiResponse.notFound('設定が見つかりません');

      auditLogService
        .create(tenantId, {
          request,
          action: 'DISPLAY_CONFIG_UPDATE',
          detail: `ディスプレイ設定(ID:${configId})を削除`,
        })
        .catch((err) => logger.error('Audit log failed', err));

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to delete display config');
    }
  },

  /** configId 指定で設定名を変更する。 */
  async renameConfig(request: NextRequest, configId: number) {
    try {
      await requireActiveLicense(request);
      const tenantId = await getTenantId(request);
      const body = await request.json();
      const name = typeof body.name === 'string' ? body.name.trim() : '';

      if (!Number.isFinite(configId)) {
        return ApiResponse.badRequest('Invalid configId');
      }
      if (!name) {
        return ApiResponse.badRequest('設定名を入力してください');
      }

      const ok = await displayService.renameConfig(tenantId, configId, name);
      if (!ok) return ApiResponse.notFound('設定が見つかりません');

      return ApiResponse.success({ success: true });
    } catch (error) {
      return ApiResponse.fromError(error, 'Failed to rename display config');
    }
  },
};
