'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import TermsAcceptanceModal from './TermsAcceptanceModal';

/** 同意モーダルを出さないパス（ログイン画面など） */
const EXEMPT_PATH_PREFIXES = ['/login', '/admin/login', '/setup'];

export default function TermsAcceptanceGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status !== 'authenticated' || !session?.user) return null;

  // SUPER_ADMIN は同意フローをスキップ（運営側ロール）
  if (session.user.role === 'SUPER_ADMIN') return null;

  // SUPER_ADMIN が impersonate 中の操作も対象外（運営確認用途）
  if (session.user.isSuperAdminImpersonating) return null;

  // 認証フロー上のパスでは表示しない
  if (
    pathname &&
    EXEMPT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  const accepted =
    !!session.user.termsAcceptedAt && !!session.user.privacyAcceptedAt;
  if (accepted) return null;

  return <TermsAcceptanceModal />;
}
