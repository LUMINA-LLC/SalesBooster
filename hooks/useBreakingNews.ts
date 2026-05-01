'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export interface BreakingNewsEntry {
  memberName: string;
  memberImageUrl?: string;
  value: number;
  unit?: string;
  dataTypeName?: string;
  videoId?: string;
  message?: string;
}

interface BreakingNewsRecord {
  id: number;
  memberName: string;
  memberImageUrl?: string;
  value: number;
  unit: string;
  dataTypeId: number | null;
  dataTypeName: string;
  breakingNewsMessage: string;
  breakingNewsVideoId: string;
  createdAt: string;
}

interface UseBreakingNewsOptions {
  enabled: boolean;
  /** メンバー/グループフィルター用 */
  memberId?: string;
  groupId?: string;
}

/**
 * テナント別の Supabase Realtime チャネルから「新規レコード作成」broadcast を受信し、
 * payload.id をもとに認証済み API から 1 件分の表示用データを取得して速報キューに積むフック。
 *
 * 表示データの整形（dataType の unit 変換、displayConfig 反映、enabled 判定など）は
 * すべてサーバ側で行うため、クライアントは受信したデータをそのまま表示するだけ。
 */
export function useBreakingNews({
  enabled,
  memberId,
  groupId,
}: UseBreakingNewsOptions) {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId ?? null;

  const [queue, setQueue] = useState<BreakingNewsEntry[]>([]);
  const [current, setCurrent] = useState<BreakingNewsEntry | null>(null);
  const memberIdRef = useRef<string | undefined>(memberId);
  const groupIdRef = useRef<string | undefined>(groupId);
  useEffect(() => {
    memberIdRef.current = memberId;
    groupIdRef.current = groupId;
  }, [memberId, groupId]);

  /**
   * 指定 ID の速報用レコードを取得し、対象であればキューに積む。
   * サーバ側で notifyBreakingNews / dataType enabled / userIds などを判定済み。
   * 対象外であれば record は null で返るため、クライアント側ではキュー追加をスキップするだけ。
   */
  const fetchAndEnqueue = useCallback(
    async (recordId: number) => {
      if (!enabled) return;

      try {
        const params = new URLSearchParams();
        params.set('id', String(recordId));
        if (memberIdRef.current) params.set('memberId', memberIdRef.current);
        else if (groupIdRef.current) params.set('groupId', groupIdRef.current);

        const res = await fetch(
          `/api/sales/breaking-news?${params.toString()}`,
        );
        if (!res.ok) return;

        const json = await res.json();
        const record: BreakingNewsRecord | null = json.record;
        if (!record) return;
        if (!record.value) return;

        setQueue((prev) => [
          ...prev,
          {
            memberName: record.memberName,
            memberImageUrl: record.memberImageUrl,
            value: record.value,
            unit: record.unit,
            dataTypeName: record.dataTypeName,
            videoId: record.breakingNewsVideoId,
            message: record.breakingNewsMessage,
          },
        ]);
      } catch {
        // ネットワークエラー等は無視（次の broadcast で再試行）
      }
    },
    [enabled],
  );

  // Supabase Realtime: テナント別の速報チャネルから broadcast を受信。
  useEffect(() => {
    if (!enabled || tenantId === null) return;

    const channel = supabase
      .channel(`breaking-news-${tenantId}`)
      .on('broadcast', { event: 'new-record' }, (msg) => {
        const id = (msg.payload as { id?: number } | undefined)?.id;
        if (typeof id === 'number') {
          fetchAndEnqueue(id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, tenantId, fetchAndEnqueue]);

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
