import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { auditLogRepository } from '@/server/repositories/auditLogRepository';

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const accountCode = credentials.accountCode;

        let user;

        if (accountCode) {
          // テナントユーザー: slug + email で検索
          const tenant = await prisma.tenant.findUnique({
            where: { slug: accountCode, isActive: true },
          });
          if (!tenant) return null;

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
            }
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

        if (!user) return null;

        // テナントが無効化されている場合はログイン拒否
        if (user.tenant && !user.tenant.isActive) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          imageUrl: user.imageUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as number | null;
        session.user.imageUrl = token.imageUrl as string | null;
        session.user.isSuperAdminImpersonating =
          token.isSuperAdminImpersonating ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        const tenantId = (user as { tenantId?: number | null }).tenantId;
        if (tenantId) {
          auditLogRepository
            .create({
              userId: user.id,
              action: 'USER_LOGIN',
              tenantId,
            })
            .catch((err) => console.error('Audit log failed:', err));
        }
      }
    },
    async signOut({ token }) {
      if (token?.id) {
        const tenantId = token.tenantId as number | null;
        if (tenantId) {
          auditLogRepository
            .create({
              userId: token.id as string,
              action: 'USER_LOGOUT',
              tenantId,
            })
            .catch((err) => console.error('Audit log failed:', err));
        }
      }
    },
  },
  pages: {
    signIn: '/login',
  },
};
