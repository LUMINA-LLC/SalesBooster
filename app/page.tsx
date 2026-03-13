'use client';

import { Suspense, useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import FilterBar from '@/components/FilterBar';
import SalesInputModal from '@/components/SalesInputModal';
import { ViewType } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSalesData } from '@/hooks/useSalesData';
import MobileHome from '@/components/mobile/MobileHome';
import DesktopContent from '@/components/desktop/DesktopContent';
import SetupWizard from '@/components/setup/SetupWizard';
import type { OverlayLineType } from '@/components/FilterBar';

function HomeContent() {
  const data = useSalesData();
  const isMobile = useIsMobile();

  const [currentView, setCurrentView] = useState<ViewType>('PERIOD_GRAPH');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [overlayLines, setOverlayLines] = useState<OverlayLineType[]>([
    'norma',
  ]);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // セットアップウィザード表示判定
  useEffect(() => {
    fetch('/api/setup')
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        const status = result?.data ?? result;
        if (status && status.setupCompleted === false) {
          setShowSetupWizard(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSetupFinish = async (skip: boolean) => {
    try {
      await fetch('/api/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCompleted: true }),
      });
    } catch (err) {
      console.error('Failed to update setup status:', err);
    }
    setShowSetupWizard(false);
    if (!skip) data.fetchData();
  };

  const handleAddSalesClick = () => setIsSalesModalOpen(true);

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header onAddSalesClick={handleAddSalesClick} />

      {isMobile ? (
        <MobileHome data={data} onAddSalesClick={handleAddSalesClick} />
      ) : (
        <>
          <FilterBar
            onViewChange={setCurrentView}
            onFilterChange={data.setFilter}
            onPeriodChange={data.setPeriod}
            onDataTypeChange={(id, unit) => {
              data.setDataTypeId(id);
              data.setDataTypeUnit(unit);
            }}
            onOverlayLinesChange={setOverlayLines}
          />
          <main className="w-full flex-1 min-h-0 overflow-auto">
            <DesktopContent
              data={data}
              currentView={currentView}
              overlayLines={overlayLines}
            />
          </main>
        </>
      )}

      <SalesInputModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        onSubmit={() => data.fetchData()}
      />

      {showSetupWizard && (
        <SetupWizard
          onComplete={() => handleSetupFinish(false)}
          onSkip={() => handleSetupFinish(true)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
