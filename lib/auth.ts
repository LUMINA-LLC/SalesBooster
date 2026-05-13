import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hashSync } from 'bcryptjs';
import { prisma } from './prisma';
import { auditLogService } from '@/server/services/auditLogService';
import { logger } from '@/lib/logger';

/**
 * ユーザー不在時等の早期 return パスでも bcrypt 比較を走らせて
 * 応答時間を揃え、メール存在判定のタイミング攻撃を緩和するためのダミーハッシュ。
 */
const DUMMY_PASSWORD_HASH = hashSync('__dummy_password_for_timing__', 12);

type AuthorizeReq = {
  headers?: Record<string, string | string[] | undefined>;
};

/** リクエストヘッダからクライアント IP を抽出する。プロキシ経由を考慮。 */
function extractIpAddress(req: AuthorizeReq | undefined): string | null {
  const headers = req?.headers;
  if (!headers) return null;
  const pickHeader = (name: string): string | null => {
    const v = headers[name];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const forwarded = pickHeader('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return pickHeader('x-real-ip');
}

type LoginFailureReason =
  | 'tenant_not_found'
  | 'user_not_found'
  | 'tenant_inactive'
  | 'wrong_password'
  | 'invalid_input';

/** ログイン失敗を監査ログに記録する。失敗時は静かに握りつぶす。 */
function logLoginFailed(params: {
  reason: LoginFailureReason;
  email?: string | null;
  accountCode?: string | null;
  userId?: string | null;
  tenantId?: number | null;
  ipAddress?: string | null;
}): void {
  logger.warn('Login failed', {
    reason: params.reason,
    email: params.email ?? null,
    accountCode: params.accountCode ?? null,
    userId: params.userId ?? null,
    tenantId: params.tenantId ?? null,
    ipAddress: params.ipAddress ?? null,
  });

  const detailParts = [`reason=${params.reason}`];
  if (params.email) detailParts.push(`email=${params.email}`);
  if (params.accountCode) detailParts.push(`accountCode=${params.accountCode}`);
  auditLogService
    .createSystem({
      action: 'USER_LOGIN_FAILED',
      userId: params.userId ?? null,
      tenantId: params.tenantId ?? null,
      detail: detailParts.join(' '),
      ipAddress: params.ipAddress ?? null,
    })
    .catch((err: unknown) => logger.error('Audit log failed', err));
}

const WEAK_SECRETS = [
  'sales-booster-secret-key-change-in-production',
  'secret',
  'password',
  'changeme',
];

const MIN_SECRET_LENGTH = 32;

function validateNextAuthSecret(): void {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET が設定されていません。以下のコマンドで生成してください:\n' +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `NEXTAUTH_SECRET は${MIN_SECRET_LENGTH}文字以上である必要があります（現在: ${secret.length}文字）`,
    );
  }
  if (WEAK_SECRETS.includes(secret)) {
    throw new Error(
      'NEXTAUTH_SECRET に既知の弱いシークレットが使用されています。安全なランダム値に変更してください。',
    );
  }
}

if (process.env.NODE_ENV === 'production') {
  validateNextAuthSecret();
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
        accountCode: { label: '会社アカウント', type: 'text' },
      },
      async authorize(credentials, req) {
        const ipAddress = extractIpAddress(req as AuthorizeReq | undefined);
        const email = credentials?.email ?? null;
        const accountCode = credentials?.accountCode ?? null;

        if (!credentials?.email || !credentials?.password) {
          // タイミング揃えのためダミー bcrypt を走らせる
          await compare('dummy', DUMMY_PASSWORD_HASH);
          logLoginFailed({
            reason: 'invalid_input',
            email,
            accountCode,
            ipAddress,
          });
          return null;
        }

        let user;

        if (accountCode) {
          // テナントユーザー: slug + email で検索
          const tenant = await prisma.tenant.findUnique({
            where: { slug: accountCode, isActive: true },
          });
          if (!tenant) {
            await compare(credentials.password, DUMMY_PASSWORD_HASH);
            logLoginFailed({
              reason: 'tenant_not_found',
              email,
              accountCode,
              ipAddress,
            });
            return null;
          }

          user = await prisma.user.findFirst({
            where: { email: credentials.email, tenantId: tenant.id },
            include: { tenant: true },
          });

          // テナント内にユーザーが見つからない場合、SUPER_ADMINのマスターパスを試行
          if (!user) {
            const superAdmin = await prisma.user.findFirst({
              where: {
                email: credentials.email,
                role: 'SUPER_ADMIN',
                tenantId: null,
              },
            });
            if (superAdmin) {
              const isSuperAdminPasswordValid = await compare(
                credentials.password,
                superAdmin.password,
              );
              if (isSuperAdminPasswordValid) {
                // テナントのADMINとして認証し、対象テナントのtenantIdをセット
                return {
                  id: superAdmin.id,
                  email: superAdmin.email,
                  name: superAdmin.name,
                  role: 'ADMIN',
                  tenantId: tenant.id,
                  isSuperAdminImpersonating: true,
                };
              }
              logLoginFailed({
                reason: 'wrong_password',
                email,
                accountCode,
                userId: superAdmin.id,
                tenantId: tenant.id,
                ipAddress,
              });
              return null;
            }
            // SUPER_ADMIN も見つからない場合はダミー比較でタイミング揃え
            await compare(credentials.password, DUMMY_PASSWORD_HASH);
            logLoginFailed({
              reason: 'user_not_found',
              email,
              accountCode,
              tenantId: tenant.id,
              ipAddress,
            });
            return null;
          }
        } else {
          // SUPER_ADMIN: accountCode なしで email のみ検索
          user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
              role: 'SUPER_ADMIN',
              tenantId: null,
            },
            include: { tenant: true },
          });
        }

        if (!user) {
          await compare(credentials.password, DUMMY_PASSWORD_HASH);
          logLoginFailed({
            reason: 'user_not_found',
            email,
            accountCode,
            ipAddress,
          });
          return null;
        }

        // テナントが無効化されている場合はログイン拒否
        if (user.tenant && !user.tenant.isActive) {
          await compare(credentials.password, DUMMY_PASSWORD_HASH);
          logLoginFailed({
            reason: 'tenant_inactive',
            email,
            accountCode,
            userId: user.id,
            tenantId: user.tenantId,
            ipAddress,
          });
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          logLoginFailed({
            reason: 'wrong_password',
            email,
            accountCode,
            userId: user.id,
            tenantId: user.tenantId,
            ipAddress,
          });
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          imageUrl: user.imageUrl,
          termsAcceptedAt: user.termsAcceptedAt
            ? user.termsAcceptedAt.toISOString()
            : null,
          privacyAcceptedAt: user.privacyAcceptedAt
            ? user.privacyAcceptedAt.toISOString()
            : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'USER';
        token.tenantId =
          (user as { tenantId?: number | null }).tenantId ?? null;
        token.imageUrl =
          (user as { imageUrl?: string | null }).imageUrl ?? null;
        token.isSuperAdminImpersonating =
          (user as { isSuperAdminImpersonating?: boolean })
            .isSuperAdminImpersonating ?? false;
        token.termsAcceptedAt =
          (user as { termsAcceptedAt?: string | null }).termsAcceptedAt ?? null;
        token.privacyAcceptedAt =
          (user as { privacyAcceptedAt?: string | null }).privacyAcceptedAt ??
          null;
      }
      // session 更新トリガー時 (useSession().update() 呼び出し時) は DB から再取得
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            name: true,
            email: true,
            role: true,
            tenantId: true,
            imageUrl: true,
            termsAcceptedAt: true,
            privacyAcceptedAt: true,
          },
        });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.role = fresh.role;
          token.tenantId = fresh.tenantId;
          token.imageUrl = fresh.imageUrl;
          token.termsAcceptedAt = fresh.termsAcceptedAt
            ? fresh.termsAcceptedAt.toISOString()
            : null;
          token.privacyAcceptedAt = fresh.privacyAcceptedAt
            ? fresh.privacyAcceptedAt.toISOString()
            : null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | null) ?? null;
        session.user.email = (token.email as string | null) ?? '';
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as number | null;
        session.user.imageUrl = token.imageUrl as string | null;
        session.user.isSuperAdminImpersonating =
          token.isSuperAdminImpersonating ?? false;
        session.user.termsAcceptedAt =
          (token.termsAcceptedAt as string | null) ?? null;
        session.user.privacyAcceptedAt =
          (token.privacyAcceptedAt as string | null) ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        const tenantId = (user as { tenantId?: number | null }).tenantId;
        const isSuperAdminImpersonating =
          (user as { isSuperAdminImpersonating?: boolean })
            .isSuperAdminImpersonating ?? false;
        logger.info('Login succeeded', {
          userId: user.id,
          tenantId: tenantId ?? null,
          role: (user as { role?: string }).role ?? null,
          isSuperAdminImpersonating,
        });
        if (tenantId) {
          auditLogService
            .createSystem({
              action: 'USER_LOGIN',
              userId: user.id,
              tenantId,
            })
            .catch((err: unknown) => logger.error('Audit log failed', err));
        }
      }
    },
    async signOut({ token }) {
      if (token?.id) {
        const tenantId = token.tenantId as number | null;
        logger.info('Logout', {
          userId: token.id,
          tenantId,
        });
        if (tenantId) {
          auditLogService
            .createSystem({
              action: 'USER_LOGOUT',
              userId: token.id as string,
              tenantId,
            })
            .catch((err: unknown) => logger.error('Audit log failed', err));
        }
      }
    },
  },
  pages: {
    signIn: '/login',
  },
};
