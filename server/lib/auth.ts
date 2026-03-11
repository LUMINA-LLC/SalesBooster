import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function getUserId(req: NextRequest): Promise<string> {
  const token = await getToken({ req });
  if (!token?.id) {
    throw new Error('Unauthorized: userId not found in token');
  }
  return token.id as string;
}

export async function getUserRole(req: NextRequest): Promise<string> {
  const token = await getToken({ req });
  return (token?.role as string) || 'USER';
}

export async function requireAdmin(req: NextRequest): Promise<void> {
  const role = await getUserRole(req);
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: admin access required');
  }
}

export async function getTenantId(req: NextRequest): Promise<number> {
  const token = await getToken({ req });
  if (!token?.tenantId) {
    throw new Error('Unauthorized: tenantId not found');
  }
  return token.tenantId as number;
}

export async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const role = await getUserRole(req);
  return role === 'SUPER_ADMIN';
}

export async function requireSuperAdmin(req: NextRequest): Promise<void> {
  if (!(await isSuperAdmin(req))) {
    throw new Error('Forbidden: super admin access required');
  }
}

/**
 * ライセンス期限切れ時に書き込み操作をブロック。
 * 期限切れの場合 Error を throw する。
 */
export async function requireActiveLicense(req: NextRequest): Promise<void> {
  const role = await getUserRole(req);
  if (role === 'SUPER_ADMIN') return; // SUPER_ADMINは制限なし

  const tenantId = await getTenantId(req);
  // 遅延importで循環依存を回避
  const { tenantService } = await import('../services/tenantService');
  const expired = await tenantService.isLicenseExpired(tenantId);
  if (expired) {
    throw new Error('LICENSE_EXPIRED');
  }
}
