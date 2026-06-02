'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { CustomSlideData } from '@/types/display';
import { extractYouTubeId } from '@/lib/youtube';

interface CustomSlideViewProps {
  slide: CustomSlideData;
  darkMode: boolean;
  onVideoEnd?: () => void;
}

// YouTube IFrame Player API の型定義
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onStateChange?: (event: { data: number }) => void;
            onReady?: () => void;
          };
        },
      ) => { destroy: () => void };
      PlayerState?: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  if (ytApiLoaded && window.YT) return Promise.resolve();

  return new Promise((resolve) => {
    ytApiCallbacks.push(resolve);

    if (ytApiLoading) return;
    ytApiLoading = true;

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      prevCallback?.();
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
}

function YouTubePlayer({
  videoId,
  title,
  onVideoEnd,
}: {
  videoId: string;
  title: string;
  onVideoEnd?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);
  const onVideoEndRef = useRef(onVideoEnd);
  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoEnd]);

  const createPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT) return;

    // プレイヤー用の div を作成
    const playerDiv = document.createElement('div');
    playerDiv.id = `yt-player-${videoId}-${Date.now()}`;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    playerRef.current = new window.YT.Player(playerDiv.id, {
      videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event: { data: number }) => {
          // 0 = ended
          if (event.data === 0) {
            onVideoEndRef.current?.();
          }
        },
      },
    });
  }, [videoId]);

  useEffect(() => {
    loadYouTubeAPI().then(createPlayer);

    return () => {
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore destroy errors
      }
      playerRef.current = null;
    };
  }, [createPlayer]);

  return (
    <div className="h-full w-full" aria-label={title || 'YouTube動画'}>
      <div
        ref={containerRef}
        className="w-full h-full [&>div]:w-full [&>div]:h-full [&>iframe]:w-full [&>iframe]:h-full"
      />
    </div>
  );
}

export default function CustomSlideView({
  slide,
  darkMode,
  onVideoEnd,
}: CustomSlideViewProps) {
  switch (slide.slideType) {
    case 'IMAGE':
      return (
        <div className="relative h-full w-full p-4">
          <Image
            src={slide.imageUrl}
            alt={slide.title || 'カスタムスライド'}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>
      );

    case 'YOUTUBE': {
      const videoId = extractYouTubeId(slide.content);
      if (!videoId) {
        return (
          <div
            className="h-full flex items-center justify-center"
            style={{ color: 'var(--display-text-secondary)' }}
          >
            無効なYouTube URLです
          </div>
        );
      }
      return (
        <YouTubePlayer
          videoId={videoId}
          title={slide.title}
          onVideoEnd={onVideoEnd}
        />
      );
    }

    case 'TEXT':
      return (
        <div
          className={`mx-6 my-4 flex h-[calc(100%-2rem)] flex-col items-center justify-center overflow-hidden rounded-2xl p-12 shadow-sm ring-1 ${
            darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-100'
          }`}
        >
          {/* 上部の装飾: 引用符アイコン */}
          <svg
            className="mb-6 h-12 w-12 shrink-0 opacity-80"
            viewBox="0 0 24 24"
            fill="#2193b0"
            aria-hidden
          >
            <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 0 1 7.17 9.5V6Zm10 0A5.17 5.17 0 0 0 12 11.17V18h6.83v-6.83H15.5a1.67 1.67 0 0 1 1.67-1.67V6Z" />
          </svg>

          <div className="max-w-4xl text-center">
            {slide.title && (
              <>
                <h2
                  className="mb-3 text-4xl font-bold"
                  style={{
                    color: darkMode
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(0,0,0,0.85)',
                  }}
                >
                  {slide.title}
                </h2>
                {/* タイトル下のアクセント装飾罫線 */}
                <div className="mx-auto mb-8 h-1 w-24 rounded-full bg-[#2193b0]" />
              </>
            )}
            <p
              className="whitespace-pre-wrap text-2xl leading-relaxed"
              style={{
                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              }}
            >
              {slide.content}
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
