'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DisplayConfig,
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_BREAKING_NEWS_MESSAGE,
  DEFAULT_BREAKING_NEWS_VIDEO_ID,
  TransitionType,
  CustomSlideData,
  NumberBoardMetricConfig,
} from '@/types/display';
import { ViewType, NumberBoardMetric } from '@/types';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useDisplayData, resolveUnit } from '@/hooks/useDisplayData';
import { useAutoHideCursor } from '@/hooks/useAutoHideCursor';
import { useGraphConfig } from '@/hooks/useGraphConfig';
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

/** 1ビューの描画に必要な情報をまとめたスナップショット */
interface ViewSnapshot {
  view: ViewType;
  title: string;
  customSlide: CustomSlideData | null;
  numberBoardMetrics?: NumberBoardMetric[];
  numberBoardMetricConfigs?: NumberBoardMetricConfig[];
  dataTypeId: string;
}

type TransitionPhase = 'idle' | 'out' | 'in';

// トランジションの所要時間。CSS (.vt-* クラス) の transition 値と揃える。
const TRANSITION_MS = 500;

/**
 * トランジション種類とフェーズから、ビューコンテナに付与する CSS クラス名を返す。
 * 動きの定義は globals.css の .vt-* クラスにある。
 */
function getPhaseClass(
  transition: TransitionType,
  phase: TransitionPhase,
): string {
  if (phase === 'idle') return 'vt-idle';
  const kind =
    transition === 'SLIDE_LEFT'
      ? 'slide-left'
      : transition === 'SLIDE_RIGHT'
        ? 'slide-right'
        : 'fade';
  return `vt-${kind}-${phase}`;
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
  const { config: graphConfig } = useGraphConfig();
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
    reportSummary,
    rankingData,
    loading,
    error,
    dataTypes,
  } = useDisplayData(config);
  const { current: breakingNewsEntry, dismiss: dismissBreakingNews } =
    useBreakingNews({
      enabled: true,
      memberId: config.filter?.memberId,
      groupId: config.filter?.groupId,
    });

  useAutoHideCursor(true, 3000);

  // 表示中ビューのスナップショット（描画に必要な情報をまとめて保持）
  const buildSnapshot = useCallback(
    (): ViewSnapshot => ({
      view: currentView,
      title: currentViewTitle,
      customSlide: currentViewConfig?.customSlide ?? null,
      numberBoardMetrics: currentViewConfig?.numberBoardMetrics,
      numberBoardMetricConfigs: currentViewConfig?.numberBoardMetricConfigs,
      dataTypeId: currentViewConfig?.dataTypeId ?? '',
    }),
    [currentView, currentViewTitle, currentViewConfig],
  );

  // 現在表示中のビュースナップショット
  const [displayed, setDisplayed] = useState<ViewSnapshot>(buildSnapshot);
  // トランジションフェーズ（idle=表示中, out=退場, in=静止マウント中）
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const nextSnapshot = buildSnapshot();

    if (config.transition === 'NONE') {
      setDisplayed(nextSnapshot);
      setPhase('idle');
      return;
    }

    // 逐次トランジション: 旧ビューを退場(out) → 新ビューに差し替えて
    // 「透明 or 画面外」で静止マウント(in)しレイアウト確定を待つ → 登場(idle)。
    // 新グラフの初期レイアウト測定によるちらつきを in の裏で済ませるため、
    // 内容差替と登場アニメを同時にしない。種類別の動きは getPhaseStyle が決める。
    setPhase('out');
    transitionTimerRef.current = setTimeout(() => {
      setDisplayed(nextSnapshot);
      setPhase('in'); // 透明 or 画面外で新ビューをマウント
      // レイアウト確定のため数フレーム待ってから登場
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          transitionTimerRef.current = setTimeout(() => {
            setPhase('idle'); // 登場アニメ開始
          }, 60);
        });
      });
    }, TRANSITION_MS);

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [currentView, config.transition, currentViewConfig, buildSnapshot]);

  // 描画箇所で使う表示中ビューの個別値
  const displayedView = displayed.view;
  const displayedTitle = displayed.title;
  const displayedCustomSlide = displayed.customSlide;

  const handleExit = () => {
    if (window.opener) {
      window.close();
    } else {
      onExit();
    }
  };

  // GraphConfig の darkMode を優先（共通設定）
  const isDark = graphConfig.darkMode || config.darkMode;

  // IMAGE / YOUTUBE のカスタムスライド表示中はフルスクリーン化
  const isFullscreenSlide =
    displayedView === 'CUSTOM_SLIDE' &&
    (displayedCustomSlide?.slideType === 'IMAGE' ||
      displayedCustomSlide?.slideType === 'YOUTUBE');

  // スナップショットから現在のビューを描画する。
  const renderView = (snap: ViewSnapshot) => (
    <DisplayViewRenderer
      view={snap.view}
      darkMode={isDark}
      loading={loading}
      salesData={salesData}
      recordCount={recordCount}
      cumulativeSalesData={cumulativeSalesData}
      trendData={trendData}
      reportSummary={reportSummary}
      rankingData={rankingData}
      customSlide={snap.customSlide}
      numberBoardMetrics={snap.numberBoardMetrics}
      numberBoardMetricConfigs={snap.numberBoardMetricConfigs}
      unit={resolveUnit(snap.dataTypeId, dataTypes)}
      dataTypeName={
        dataTypes.find((d) => String(d.id) === snap.dataTypeId)?.name ??
        dataTypes.find((d) => d.isDefault)?.name ??
        ''
      }
      dataTypes={dataTypes}
      filter={config.filter}
      graphConfig={graphConfig}
      onVideoEnd={isYouTubeView ? goToNext : undefined}
    />
  );

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

      {/* タイトルバー (IMAGE/YOUTUBE のカスタムスライド時はフルスクリーン化のため非表示) */}
      {displayedTitle && !isFullscreenSlide && (
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
            className={`view-transition-container ${getPhaseClass(
              config.transition,
              phase,
            )}`}
          >
            {renderView(displayed)}
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
          message={breakingNewsEntry.message ?? DEFAULT_BREAKING_NEWS_MESSAGE}
          videoId={breakingNewsEntry.videoId ?? DEFAULT_BREAKING_NEWS_VIDEO_ID}
          onDismiss={dismissBreakingNews}
        />
      )}
    </div>
  );
}
