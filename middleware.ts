import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PATHS = ['/settings'];
const ADMIN_API_PREFIXES = ['/api/settings', '/api/integrations', '/api/custom-slides', '/api/upload'];
const SUPER_ADMIN_PATHS = ['/admin'];
const SUPER_ADMIN_API_PREFIXES = ['/api/tenants', '/api/admin'];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    // APIルート: 401 JSON レスポンスを返す
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ページ: ログインページへリダイレクト
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  // SUPER_ADMIN: テナントに属さないため、一般ページは /admin へリダイレクト
  if (role === 'SUPER_ADMIN') {
    const pathname = req.nextUrl.pathname;
    const isSuperAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/');
    if (!isSuperAdminArea) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // SUPER_ADMIN 専用パス/APIのチェック
  const isSuperAdminPage = SUPER_ADMIN_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isSuperAdminApi = SUPER_ADMIN_API_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));

  if (isSuperAdminPage || isSuperAdminApi) {
    if (isSuperAdminApi) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ADMIN ロールチェック
  const isAdminPage = ADMIN_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isAdminApi = ADMIN_API_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));

  if ((isAdminPage || isAdminApi) && role !== 'ADMIN') {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!login|admin/login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
