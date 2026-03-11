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
      Player: new (elementId: string, config: {
        videoId: string;
        playerVars?: Record<string, number | string>;
        events?: {
          onStateChange?: (event: { data: number }) => void;
          onReady?: () => void;
        };
      }) => { destroy: () => void };
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

function YouTubePlayer({ videoId, title, onVideoEnd }: { videoId: string; title: string; onVideoEnd?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);
  const onVideoEndRef = useRef(onVideoEnd);
  onVideoEndRef.current = onVideoEnd;

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
      <div ref={containerRef} className="w-full h-full [&>div]:w-full [&>div]:h-full [&>iframe]:w-full [&>iframe]:h-full" />
    </div>
  );
}

export default function CustomSlideView({ slide, darkMode, onVideoEnd }: CustomSlideViewProps) {
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
          <div className="h-full flex items-center justify-center" style={{ color: 'var(--display-text-secondary)' }}>
            無効なYouTube URLです
          </div>
        );
      }
      return <YouTubePlayer videoId={videoId} title={slide.title} onVideoEnd={onVideoEnd} />;
    }

    case 'TEXT':
      return (
        <div className="h-full w-full flex items-center justify-center p-8">
          <div className="text-center max-w-3xl">
            {slide.title && (
              <h2
                className="text-4xl font-bold mb-6"
                style={{ color: darkMode ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)' }}
              >
                {slide.title}
              </h2>
            )}
            <p
              className="text-2xl leading-relaxed whitespace-pre-wrap"
              style={{ color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}
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
