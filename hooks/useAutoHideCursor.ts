'use client';

import { useEffect, useRef } from 'react';

export function useAutoHideCursor(
  enabled: boolean = true,
  hideAfterMs: number = 3000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const showCursor = () => {
      document.documentElement.classList.remove('cursor-hidden');
    };

    const hideCursor = () => {
      document.documentElement.classList.add('cursor-hidden');
    };

    const resetTimer = () => {
      showCursor();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hideCursor, hideAfterMs);
    };

    resetTimer();

    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('mousedown', resetTimer);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      showCursor();
      document.removeEventListener('mousemove', resetTimer);
      document.removeEventListener('mousedown', resetTimer);
    };
  }, [enabled, hideAfterMs]);
}
