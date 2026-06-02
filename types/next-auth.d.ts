import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      tenantId: number | null;
      imageUrl?: string | null;
      isSuperAdminImpersonating?: boolean;
      termsAcceptedAt?: string | null;
      privacyAcceptedAt?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    tenantId: number | null;
    imageUrl?: string | null;
    isSuperAdminImpersonating?: boolean;
    termsAcceptedAt?: string | null;
    privacyAcceptedAt?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    tenantId: number | null;
    imageUrl?: string | null;
    isSuperAdminImpersonating?: boolean;
    termsAcceptedAt?: string | null;
    privacyAcceptedAt?: string | null;
    /** セッション更新時に無効化/削除が検出されたユーザーを示すフラグ */
    inactive?: boolean;
  }
}
