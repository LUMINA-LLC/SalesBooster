'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';
import DisplayModeButton from './DisplayModeButton';
import SalesInputButton from './SalesInputButton';
import UserDropdown from './UserDropdown';
import { SettingsSection, menuItems as settingsMenuItems } from '@/components/settings/SettingsSidebar';
import LicenseBanner from './LicenseBanner';

interface HeaderProps {
  onAddSalesClick?: () => void;
  subtitle?: string;
  rightContent?: React.ReactNode;
  activeSettingsSection?: SettingsSection;
  onSettingsSectionChange?: (section: SettingsSection) => void;
}

export default function Header({ onAddSalesClick, subtitle, rightContent, activeSettingsSection, onSettingsSectionChange }: HeaderProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'ユーザー';
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isSuperAdminImpersonating = session?.user?.isSuperAdminImpersonating ?? false;
  const router = useRouter();
  const pathname = usePathname();
  const isSettingsPage = pathname.startsWith('/settings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      {isSuperAdminImpersonating && (
        <div className="bg-amber-500 text-white text-center text-xs font-medium py-1.5 px-4">
          SUPER_ADMIN としてこのテナントにアクセス中
        </div>
      )}
      <LicenseBanner />
      <div className="flex items-center justify-between min-h-10 p-3 md:p-5">
        <Logo subtitle={subtitle} />

        <div className="flex items-center space-x-3">
          {/* PC: ボタン群 */}
          {rightContent ? (
            <div className="hidden md:flex items-center space-x-3">{rightContent}</div>
          ) : onAddSalesClick ? (
            <>
              <div className="hidden md:block">
                <DisplayModeButton />
              </div>
              <div className="hidden md:block">
                <SalesInputButton onClick={onAddSalesClick} />
              </div>
            </>
          ) : null}

          {/* PC: UserDropdown */}
          {(rightContent || onAddSalesClick) && <div className="hidden md:block h-8 w-px bg-gray-300"></div>}
          <div className="hidden md:block">
            <UserDropdown userName={userName} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} isSuperAdminImpersonating={isSuperAdminImpersonating} />
          </div>

          {/* モバイル: ハンバーガーメニュー */}
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="メニュー"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-[80vh] overflow-y-auto">
                {isSuperAdmin ? (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/admin'); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>テナント管理</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/'); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>ダッシュボード</span>
                    </button>
                    {isAdmin && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/settings'); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>設定</span>
                    </button>
                    )}
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/sales/records'); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>売上データ管理</span>
                    </button>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>ヘルプ</span>
                    </button>
                  </>
                )}

                {/* 管理画面: サイドバーメニュー */}
                {isSettingsPage && onSettingsSectionChange && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-4 py-1.5">
                      <span className="text-xs font-semibold text-gray-400 uppercase">設定メニュー</span>
                    </div>
                    {settingsMenuItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => { setMobileMenuOpen(false); onSettingsSectionChange(item.key); }}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                          activeSettingsSection === item.key
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={activeSettingsSection === item.key ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </>
                )}

                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>ログアウト</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
