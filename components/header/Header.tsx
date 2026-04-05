'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Logo from './Logo';
import DisplayModeButton from './DisplayModeButton';
import SalesInputButton from './SalesInputButton';
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';
import { SettingsSection } from '@/components/settings/SettingsSidebar';
import LicenseBanner from './LicenseBanner';

interface HeaderProps {
  onAddSalesClick?: () => void;
  subtitle?: string;
  rightContent?: React.ReactNode;
  activeSettingsSection?: SettingsSection;
  onSettingsSectionChange?: (section: SettingsSection) => void;
}

export default function Header({
  onAddSalesClick,
  subtitle,
  rightContent,
  activeSettingsSection,
  onSettingsSectionChange,
}: HeaderProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'ユーザー';
  const userRole = session?.user?.role;
  const userImageUrl = session?.user?.imageUrl;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isSuperAdminImpersonating =
    session?.user?.isSuperAdminImpersonating ?? false;

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
            <div className="hidden md:flex items-center space-x-3">
              {rightContent}
            </div>
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
          {(rightContent || onAddSalesClick) && (
            <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          )}
          <div className="hidden md:block">
            <UserDropdown
              userName={userName}
              imageUrl={userImageUrl}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              isSuperAdminImpersonating={isSuperAdminImpersonating}
            />
          </div>

          {/* モバイル: ハンバーガーメニュー */}
          <MobileMenu
            userName={userName}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            isSuperAdminImpersonating={isSuperAdminImpersonating}
            onAddSalesClick={onAddSalesClick}
            activeSettingsSection={activeSettingsSection}
            onSettingsSectionChange={onSettingsSectionChange}
          />
        </div>
      </div>
    </header>
  );
}
