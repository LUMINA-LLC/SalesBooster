'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DisplayConfig,
  DisplayViewConfig,
  getViewTitle,
} from '@/types/display';
import { ViewType } from '@/types';

interface UseDisplayModeReturn {
  currentView: ViewType;
  currentViewTitle: string;
  currentViewIndex: number;
  currentViewConfig: DisplayViewConfig | null;
  enabledViews: DisplayViewConfig[];
  progress: number;
  isLastView: boolean;
  isYouTubeView: boolean;
  goToNext: () => void;
  goToPrev: () => void;
}

export function useDisplayMode(config: DisplayConfig): UseDisplayModeReturn {
  const enabledViews = useMemo(
    () =>
      config.views.filter((v) => v.enabled).sort((a, b) => a.order - b.order),
    [config.views],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const currentDuration = enabledViews[currentIndex]?.duration ?? 30;
  const isYouTubeView =
    enabledViews[currentIndex]?.viewType === 'CUSTOM_SLIDE' &&
    enabledViews[currentIndex]?.customSlide?.slideType === 'YOUTUBE';

  // プログレスバー更新 + ビュー切替タイマー（YouTubeスライドではタイマー停止）
  useEffect(() => {
    if (enabledViews.length === 0) return;

    elapsedRef.current = 0;
    setProgress(0);

    // YouTubeスライドの場合はタイマーを起動しない（動画終了で次へ進む）
    if (isYouTubeView) return;

    const intervalId = setInterval(() => {
      elapsedRef.current += 1;
      const pct = (elapsedRef.current / currentDuration) * 100;
      setProgress(Math.min(pct, 100));

      if (elapsedRef.current >= currentDuration) {
        const idx = currentIndexRef.current;
        const isLast = idx >= enabledViews.length - 1;

        if (isLast && !config.loop) {
          clearInterval(intervalId);
          return;
        }

        const nextIndex = isLast ? 0 : idx + 1;
        setCurrentIndex(nextIndex);
        elapsedRef.current = 0;
        setProgress(0);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    currentIndex,
    currentDuration,
    enabledViews.length,
    config.loop,
    isYouTubeView,
  ]);

  const goToNext = useCallback(() => {
    if (enabledViews.length === 0) return;
    setCurrentIndex((prev) => (prev >= enabledViews.length - 1 ? 0 : prev + 1));
  }, [enabledViews.length]);

  const goToPrev = useCallback(() => {
    if (enabledViews.length === 0) return;
    setCurrentIndex((prev) => (prev <= 0 ? enabledViews.length - 1 : prev - 1));
  }, [enabledViews.length]);

  const currentViewConfig = enabledViews[currentIndex];

  return {
    currentView: currentViewConfig?.viewType ?? 'PERIOD_GRAPH',
    currentViewTitle: currentViewConfig ? getViewTitle(currentViewConfig) : '',
    currentViewIndex: currentIndex,
    currentViewConfig: currentViewConfig ?? null,
    enabledViews,
    progress,
    isLastView: currentIndex >= enabledViews.length - 1,
    isYouTubeView,
    goToNext,
    goToPrev,
  };
}
