'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Header from '@/components/header/Header';
import SettingsSidebar, { SettingsSection } from '@/components/settings/SettingsSidebar';
import MemberSettings from '@/components/settings/MemberSettings';
import GroupSettings from '@/components/settings/GroupSettings';
import GraphSettings from '@/components/settings/GraphSettings';
import DisplaySettings from '@/components/settings/DisplaySettings';
import TargetSettings from '@/components/settings/TargetSettings';
import ReportSettings from '@/components/settings/ReportSettings';
import RecordSettings from '@/components/settings/RecordSettings';
import EmailSettings from '@/components/settings/EmailSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import IntegrationSettings from '@/components/settings/IntegrationSettings';
import LogViewer from '@/components/settings/LogViewer';
import DataTypeSettings from '@/components/settings/DataTypeSettings';
import LicenseSettings from '@/components/settings/LicenseSettings';

const VALID_SECTIONS: SettingsSection[] = [
  'member', 'group', 'dataType', 'graph', 'display', 'target',
  'report', 'record', 'email', 'system', 'integration', 'log', 'license',
];

function isValidSection(value: string | null): value is SettingsSection {
  return VALID_SECTIONS.includes(value as SettingsSection);
}

export default function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sectionParam = searchParams.get('section');
  const initialSection = isValidSection(sectionParam) ? sectionParam : 'member';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'member': return <MemberSettings />;
      case 'group': return <GroupSettings />;
      case 'dataType': return <DataTypeSettings />;
      case 'graph': return <GraphSettings />;
      case 'display': return <DisplaySettings />;
      case 'target': return <TargetSettings />;
      case 'report': return <ReportSettings />;
      case 'record': return <RecordSettings />;
      case 'email': return <EmailSettings />;
      case 'system': return <SystemSettings />;
      case 'integration': return <IntegrationSettings />;
      case 'log': return <LogViewer />;
      case 'license': return <LicenseSettings />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header
        subtitle="管理画面"
        activeSettingsSection={activeSection}
        onSettingsSectionChange={handleSectionChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
