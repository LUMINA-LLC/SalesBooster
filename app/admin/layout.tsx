'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // ログインページはレイアウトなし
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.replace('/');
    }
  }, [status, session, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
