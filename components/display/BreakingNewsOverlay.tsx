'use client';

import { useEffect, useRef, useState } from 'react';
import { BreakingNewsEntry } from '@/hooks/useBreakingNews';
import { getUnitLabel } from '@/lib/units';

const VIDEO_SRC = '/movies/1.mp4';
const OVERLAY_DELAY_MS = 2000; // 動画開始後2秒でオーバーレイ表示

interface BreakingNewsOverlayProps {
  entry: BreakingNewsEntry;
  message: string; // 設定画面で事前設定したメッセージ
  onDismiss: () => void;
}

export default function BreakingNewsOverlay({
  entry,
  message,
  onDismiss,
}: BreakingNewsOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false); // フェードイン用
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // muted autoplay でブラウザポリシーを満たした上で再生を試みる
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // 自動再生がブロックされた場合は即dismiss
        onDismiss();
      });
    }

    // 動画開始後、一定時間経過でオーバーレイ表示
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlay(true);
      requestAnimationFrame(() => setOverlayVisible(true));
    }, OVERLAY_DELAY_MS);

    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 値のフォーマット
  const formattedValue = entry.value.toLocaleString();
  const unitLabel = entry.unit ? getUnitLabel(entry.unit) : '万円';

  // イニシャル取得
  const initial = entry.memberName ? entry.memberName.charAt(0) : '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* 動画 */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        onEnded={onDismiss}
        onError={onDismiss}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* オーバーレイ */}
      {showOverlay && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            overlayVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center gap-8 px-16 py-12 rounded-3xl bg-black/50 backdrop-blur-sm">
            {/* メンバー写真 */}
            <div className="relative">
              {entry.memberImageUrl ? (
                <img
                  src={entry.memberImageUrl}
                  alt={entry.memberName}
                  className="w-48 h-48 rounded-2xl object-cover border-4 border-yellow-400 shadow-lg shadow-yellow-400/30"
                />
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-yellow-400 shadow-lg shadow-yellow-400/30">
                  <span className="text-7xl font-bold text-white">
                    {initial}
                  </span>
                </div>
              )}
            </div>

            {/* メンバー名 */}
            <h2 className="text-5xl font-bold text-white tracking-wide">
              {entry.memberName}
            </h2>

            {/* 実績 */}
            <div className="flex items-baseline gap-3">
              <span className="text-8xl font-extrabold text-yellow-400 tabular-nums">
                {formattedValue}
              </span>
              <span className="text-4xl text-yellow-300">{unitLabel}</span>
            </div>

            {/* メッセージ */}
            {message && (
              <p className="text-3xl text-white/90 mt-2 font-medium">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
