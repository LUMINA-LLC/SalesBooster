'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DisplayConfig,
  DEFAULT_DISPLAY_CONFIG,
  TransitionType,
  CustomSlideData,
  NumberBoardMetricConfig,
} from '@/types/display';
import { ViewType, NumberBoardMetric } from '@/types';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useDisplayData, resolveUnit } from '@/hooks/useDisplayData';
import { useAutoHideCursor } from '@/hooks/useAutoHideCursor';
import DisplayMiniHeader from '@/components/display/DisplayMiniHeader';
import DisplayViewRenderer from '@/components/display/DisplayViewRenderer';
import CompanyOverlay from '@/components/display/CompanyOverlay';
import BreakingNewsOverlay from '@/components/display/BreakingNewsOverlay';
import { useBreakingNews } from '@/hooks/useBreakingNews';

export default function DisplayPage() {
  const router = useRouter();
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    fetch('/api/settings/display')
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data) => {
        if (!data.views || !Array.isArray(data.views)) {
          setConfig(DEFAULT_DISPLAY_CONFIG);
        } else {
          setConfig({ ...DEFAULT_DISPLAY_CONFIG, ...data });
        }
      })
      .catch(() => setConfig(DEFAULT_DISPLAY_CONFIG));
  }, []);

  if (!config) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DisplayContent
      config={config}
      showHeader={showHeader}
      setShowHeader={setShowHeader}
      onExit={() => router.push('/')}
    />
  );
}

function getTransitionClass(
  transition: TransitionType,
  phase: 'idle' | 'exiting' | 'entering',
): string {
  if (transition === 'NONE' || phase === 'idle') return '';
  const prefix =
    transition === 'FADE'
      ? 'view-fade'
      : transition === 'SLIDE_LEFT'
        ? 'view-slide-left'
        : 'view-slide-right';
  if (phase === 'exiting') return `${prefix}-exit`;
  if (phase === 'entering') return `${prefix}-enter`;
  return '';
}

function DisplayContent({
  config,
  showHeader,
  setShowHeader,
  onExit,
}: {
  config: DisplayConfig;
  showHeader: boolean;
  setShowHeader: (v: boolean) => void;
  onExit: () => void;
}) {
  const {
    currentView,
    currentViewTitle,
    currentViewIndex,
    currentViewConfig,
    enabledViews,
    progress,
    isYouTubeView,
    goToNext,
    goToPrev,
  } = useDisplayMode(config);
  const {
    salesData,
    recordCount,
    cumulativeSalesData,
    trendData,
    reportData,
    rankingData,
    loading,
    error,
    dataTypes,
  } = useDisplayData(config, currentViewConfig?.dataTypeId);
  const { current: breakingNewsEntry, dismiss: dismissBreakingNews } =
    useBreakingNews({
      enabled: true,
      pollingInterval: config.dataRefreshInterval,
      memberId: config.filter?.memberId,
      groupId: config.filter?.groupId,
    });

  useAutoHideCursor(true, 3000);

  const [transitionPhase, setTransitionPhase] = useState<
    'idle' | 'exiting' | 'entering'
  >('idle');
  const [displayedView, setDisplayedView] = useState<ViewType>(currentView);
  const [displayedTitle, setDisplayedTitle] = useState(currentViewTitle);
  const [displayedCustomSlide, setDisplayedCustomSlide] =
    useState<CustomSlideData | null>(currentViewConfig?.customSlide ?? null);
  const [displayedNumberBoardMetrics, setDisplayedNumberBoardMetrics] =
    useState<NumberBoardMetric[] | undefined>(
      currentViewConfig?.numberBoardMetrics,
    );
  const [
    displayedNumberBoardMetricConfigs,
    setDisplayedNumberBoardMetricConfigs,
  ] = useState<NumberBoardMetricConfig[] | undefined>(
    currentViewConfig?.numberBoardMetricConfigs,
  );
  const [displayedDataTypeId, setDisplayedDataTypeId] = useState<string>(
    currentViewConfig?.dataTypeId ?? '',
  );
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (config.transition === 'NONE') {
      setDisplayedView(currentView);
      setDisplayedTitle(currentViewTitle);
      setDisplayedCustomSlide(currentViewConfig?.customSlide ?? null);
      setDisplayedNumberBoardMetrics(currentViewConfig?.numberBoardMetrics);
      setDisplayedNumberBoardMetricConfigs(
        currentViewConfig?.numberBoardMetricConfigs,
      );
      setDisplayedDataTypeId(currentViewConfig?.dataTypeId ?? '');
      setTransitionPhase('idle');
      return;
    }

    setTransitionPhase('exiting');
    transitionTimerRef.current = setTimeout(() => {
      setDisplayedView(currentView);
      setDisplayedTitle(currentViewTitle);
      setDisplayedCustomSlide(currentViewConfig?.customSlide ?? null);
      setDisplayedNumberBoardMetrics(currentViewConfig?.numberBoardMetrics);
      setDisplayedNumberBoardMetricConfigs(
        currentViewConfig?.numberBoardMetricConfigs,
      );
      setDisplayedDataTypeId(currentViewConfig?.dataTypeId ?? '');
      requestAnimationFrame(() => {
        setTransitionPhase('entering');
        transitionTimerRef.current = setTimeout(() => {
          setTransitionPhase('idle');
        }, 500);
      });
    }, 300);

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [currentView, config.transition, currentViewConfig]);

  const handleExit = () => {
    if (window.opener) {
      window.close();
    } else {
      onExit();
    }
  };

  const isDark = config.darkMode;

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden relative ${isDark ? 'display-dark' : 'display-light'}`}
      style={{ backgroundColor: 'var(--display-bg)' }}
      onMouseMove={(e) => {
        setShowHeader(e.clientY < 60);
      }}
    >
      <DisplayMiniHeader
        visible={showHeader}
        displayedView={displayedView}
        currentViewIndex={currentViewIndex}
        enabledViews={enabledViews}
        progress={progress}
        onPrev={goToPrev}
        onNext={goToNext}
        onExit={handleExit}
      />

      {/* タイトルバー */}
      {displayedTitle && (
        <div
          className={`shrink-0 px-6 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          style={{
            backgroundColor: isDark ? 'var(--display-bg)' : 'var(--display-bg)',
            color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
          }}
        >
          <span className="text-lg font-bold">{displayedTitle}</span>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="text-center"
              style={{ color: 'var(--display-text, #6b7280)' }}
            >
              <div className="text-lg mb-2">{error}</div>
              <div className="text-sm opacity-60">自動的に再取得を試みます</div>
            </div>
          </div>
        ) : (
          <div
            className={`view-transition-container ${getTransitionClass(config.transition, transitionPhase)}`}
          >
            <DisplayViewRenderer
              view={displayedView}
              darkMode={isDark}
              loading={loading}
              salesData={salesData}
              recordCount={recordCount}
              cumulativeSalesData={cumulativeSalesData}
              trendData={trendData}
              reportData={reportData}
              rankingData={rankingData}
              customSlide={displayedCustomSlide}
              numberBoardMetrics={displayedNumberBoardMetrics}
              numberBoardMetricConfigs={displayedNumberBoardMetricConfigs}
              unit={resolveUnit(displayedDataTypeId, dataTypes)}
              dataTypes={dataTypes}
              filter={config.filter}
              onVideoEnd={isYouTubeView ? goToNext : undefined}
            />
          </div>
        )}
      </main>

      <CompanyOverlay
        companyLogoUrl={config.companyLogoUrl}
        teamName={config.teamName}
      />

      {/* 速報オーバーレイ */}
      {breakingNewsEntry && (
        <BreakingNewsOverlay
          entry={breakingNewsEntry}
          message={config.breakingNewsMessage}
          videoId={config.breakingNewsVideoId}
          onDismiss={dismissBreakingNews}
        />
      )}
    </div>
  );
}
