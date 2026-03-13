'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DATA_REFRESH_INTERVAL_MS, DataRefreshInterval } from '@/types/display';

export interface BreakingNewsEntry {
  memberName: string;
  memberImageUrl?: string;
  value: number;
  unit?: string;
  dataTypeName?: string;
}

interface LatestRecord {
  id: number;
  memberName: string;
  memberImageUrl?: string;
  value: number;
  unit: string;
  dataTypeName: string;
  createdAt: string;
}

interface UseBreakingNewsOptions {
  enabled: boolean;
  pollingInterval: DataRefreshInterval;
  /** メンバー/グループフィルター用 */
  memberId?: string;
  groupId?: string;
}

/**
 * 全データ種別を対象に、新規データ入力を検出して速報キューに積むフック。
 * 速報専用API /api/sales/breaking-news を使用し、
 * recordCountの増加を検出→最新レコードから速報エントリを構築する。
 */
export function useBreakingNews({
  enabled,
  pollingInterval,
  memberId,
  groupId,
}: UseBreakingNewsOptions) {
  const [queue, setQueue] = useState<BreakingNewsEntry[]>([]);
  const [current, setCurrent] = useState<BreakingNewsEntry | null>(null);
  const prevRecordCountRef = useRef<number | null>(null);
  const prevSeenIdsRef = useRef<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const fetchAndDetect = useCallback(async () => {
    if (!enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (memberId) params.set('memberId', memberId);
      else if (groupId) params.set('groupId', groupId);

      const res = await fetch(`/api/sales/breaking-news?${params.toString()}`, {
        signal,
      });
      if (signal.aborted || !res.ok) return;

      const json = await res.json();
      const recordCount: number = json.recordCount;
      const latest: LatestRecord[] = json.latest;

      // 初回は基準値をセットするだけ
      if (prevRecordCountRef.current === null) {
        prevRecordCountRef.current = recordCount;
        prevSeenIdsRef.current = new Set(latest.map((r) => r.id));
        return;
      }

      // レコード数が増えていなければスキップ
      if (recordCount <= prevRecordCountRef.current) {
        prevRecordCountRef.current = recordCount;
        prevSeenIdsRef.current = new Set(latest.map((r) => r.id));
        return;
      }

      // 新規レコード（前回見ていないID）を速報エントリに変換
      const prevIds = prevSeenIdsRef.current;
      const newEntries: BreakingNewsEntry[] = [];

      for (const record of latest) {
        if (!prevIds.has(record.id)) {
          newEntries.push({
            memberName: record.memberName,
            memberImageUrl: record.memberImageUrl,
            value: record.value,
            unit: record.unit,
            dataTypeName: record.dataTypeName,
          });
        }
      }

      if (newEntries.length > 0) {
        setQueue((prev) => [...prev, ...newEntries]);
      }

      prevRecordCountRef.current = recordCount;
      prevSeenIdsRef.current = new Set(latest.map((r) => r.id));
    } catch {
      // ネットワークエラー等は無視（次回ポーリングで再試行）
    }
  }, [enabled, memberId, groupId]);

  // 初回取得
  useEffect(() => {
    fetchAndDetect();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchAndDetect]);

  // ポーリング
  useEffect(() => {
    if (!enabled) return;
    const intervalMs = DATA_REFRESH_INTERVAL_MS[pollingInterval] ?? 10_000;
    const id = setInterval(fetchAndDetect, intervalMs);
    return () => clearInterval(id);
  }, [enabled, pollingInterval, fetchAndDetect]);

  // キューから1件ずつ取り出してcurrentにセット
  useEffect(() => {
    if (current !== null || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
  }, [current, queue]);

  const dismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  return { current, dismiss, queueLength: queue.length };
}
