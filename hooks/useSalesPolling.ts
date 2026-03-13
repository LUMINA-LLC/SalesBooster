'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_POLLING_INTERVAL_MS = 5000;

interface UseSalesPollingOptions {
  onUpdate: () => void;
  intervalMs?: number;
}

export function useSalesPolling({
  onUpdate,
  intervalMs = DEFAULT_POLLING_INTERVAL_MS,
}: UseSalesPollingOptions) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const id = setInterval(() => {
      onUpdateRef.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
}
